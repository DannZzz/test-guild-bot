import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "member-down",
    aliases: ["md"],
    description: "понизить участника гильдии",
    category: 1,
    cooldown: 3,
    examples: ["{prefix}md @Zion#6541"],
    async run({msg, args, methods, client, anyData}) {
        let myGuild: GuildSchema;
        if  (anyData) {
            myGuild = anyData
        } else {
            myGuild = await getMemberGuild(msg.author.id) as any;
            if (!myGuild) return Embed(msg).setError("Вы не состоите в гильдии.").send();
            if (myGuild.leader !== msg.author.id) return Embed(msg).setError("У вас недостаточно прав.").send();
        }
        
        if (!args[0]) return methods.createError(msg, "Укажите участника.", "member-up").send();
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return Embed(msg).setError("Участник не найден!").send();
        if (member.id === myGuild.leader) return Embed(msg).setError("Этого участника нельзя понизить!").send();

        const guild = await fetchGuild(myGuild.name, {members: true, helpers: true});
        if (!guild.members.find(o => o._id === member.id)) return Embed(msg).setError("Этот пользователь не участник вашей гильдии.").send();

        if (guild.helpers.find(o => o._id === member.id)) {
            const newArr = client.util.remove(myGuild.helpers, {elements: [member.id], indexes: []});
            await guilds.updateOne({name: guild.Guild.name}, {$set: {helpers: newArr}});
            return Embed(msg).setSuccess(`**${member.user.username}** успешно понижен до участника.`).send();
        } else {
            return Embed(msg).setError(`**${member.user.username}** не имеет особую должность.`).send();
        }
        
    }
})