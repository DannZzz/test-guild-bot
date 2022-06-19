import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "kick",
    aliases: ["k"],
    description: "выгнать участника гильдии",
    category: 1,
    cooldown: 3,
    examples: ["{prefix}kick @Aeolian#0001 @Dann#1000", "{prefix}k 4587941749719748 @Aeilian#0001"],
    run: async ({msg, args, client, methods}) => {
        const guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!hasPermissionsInGuild(guild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();
        if (!args[0]) return methods.createError(msg, "Укажите участника вашей гильдии.", "kick").send();
        const membersForKick = msg.mentions.members.map(u => u.id);
        const memberForKickArgs = args.map(string => {
            const m = msg.guild.members.cache.get(string);
            if (m) return m.id
        });
        const member = [... new Set(memberForKickArgs.concat(membersForKick))];
        if (member.length === 0) return methods.createError(msg, "Укажите участника вашей гильдии.", "kick").send();
        const fetch = await fetchGuild(guild.name, {members: true, helpers: true});
        const memberInGuild = fetch.members.some(obj => member.includes(obj._id));
        if (!memberInGuild) return Embed(msg).setError("Участник(-и) гильдии не найден(-ы).").send();
        const onlyThisGuildMembers = fetch.members.filter(obj => member.includes(obj._id) && (fetch.helpers.find(x => x._id === msg.author.id) && fetch.helpers.find(x => x._id === obj._id) ? false : true) )
        
        const helpersList = client.util.remove(fetch.helpers.map(x => x._id), {elements: onlyThisGuildMembers.map(x => x._id), indexes: []});
        await Promise.all([
            members.updateMany({_id: {$in: onlyThisGuildMembers}}, {$unset: {guildName: ""}}),
            guilds.updateOne({name: guild.name}, {$set: {helpers: helpersList}})
        ])
        
        Embed(msg).setSuccess(`Участник(-и) успешно выгнан(-ы).`).send();
    }
})