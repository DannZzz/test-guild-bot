import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "member-up",
    aliases: ["mu"],
    description: "повысить участника гильдии",
    category: 1,
    cooldown: 3,
    examples: ["{prefix}mu @Zion#6541"],
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
        if (member.id === myGuild.leader) return Embed(msg).setError("Этого участника нельзя повысить!").send();

        const guild = await fetchGuild(myGuild.name, {members: true, helpers: true});
        if (!guild.members.find(o => o._id === member.id)) return Embed(msg).setError("Этот пользователь не участник вашей гильдии.").send();

        if (guild.helpers.find(o => o._id === member.id)) {
            let b = false;
            const collector = new MessageCollectorExp(msg.channel, {filter: [msg.author.id], time: 20000});
            Embed(msg).setText("Вы уверены что хотите передать все права другому участнику?\n\nНапишите `да` или `нет`.").send().then(m => setTimeout(() => m.delete(), 15000));
            collector.on("да", async (m) => {
                b = true
                collector.stop();
                const newArr = client.util.remove(myGuild.helpers, {elements: [member.id], indexes: []});
                await guilds.updateOne({name: guild.Guild.name}, {$set: {leader: member.id, helpers: newArr}});
                return Embed(msg).setSuccess(`Участник **${member.user.username}** успешно повышен до владелца.`).send();
            });

            collector.end(() => !b && Embed(msg).setError("Время вышло, попробуйте позже.").send());
        } else {
            await guilds.updateOne({name: guild.Guild.name}, {$push: {helpers: member.id}});
            return Embed(msg).setSuccess(`Участник **${member.user.username}** успешно повышен до хелпера.`).send();
        }
        
    }
})