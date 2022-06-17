import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "ban",
    aliases: ["b"],
    description: "забанить участника гильдии",
    category: 1,
    cooldown: 3,
    examples: ["{prefix}ban @Aeolian#0001", "{prefix}b 4587941749719748"],
    run: async ({msg, args, client, methods}) => {
        const guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!guild) return Embed(msg).setError("Вы не состоите в гильдии.").send();
        if (!hasPermissionsInGuild(guild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();
        if (!args[0]) return methods.createError(msg, "Укажите участника вашей гильдии.", "ban").send();
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return methods.createError(msg, "Участник не найден.", "ban").send();
        const fetch = await fetchGuild(guild.name, {members: true, helpers: true});
        const memberInGuild = fetch.members.find(obj => obj._id === member.id);
        if (!memberInGuild) return Embed(msg).setError("Участник гильдии не найден.").send();
        if (fetch.helpers.find(x => x._id === msg.author.id) && fetch.helpers.find(x => x._id === member.id)) return  Embed(msg).setError("У вас недостаточно прав.").send();
        const helpersList = client.util.remove(fetch.helpers.map(x => x._id), {elements: [member.id], indexes: []});
        await Promise.all([
            members.updateOne({_id: memberInGuild._id}, {$unset: {guildName: ""}}),
            guilds.updateOne({name: guild.name}, {$push: {bans: member.id}, $set: {helpers: helpersList}})
        ])

        Embed(msg).setSuccess(`Участник **${member.user.username}** успешно забанен.`).send();
    }
})