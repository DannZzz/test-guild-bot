import { getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "leave-guild",
    aliases: ["lg", 'leave'],
    category: 2,
    description: "выйти из гильдии",
    cooldown: 5,
    async run ({msg, client, prefix}) {
        const thisGuild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!thisGuild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        if (thisGuild.leader === msg.author.id) return Embed(msg).setError(`Вы владелец, не можете выходить из этой гильдии.\nНазначить нового владелца: \`${prefix}member-up @Zion#2651\``).send();
        
        await Embed(msg).setText(`Вы уверены, что хотите выйти из гильдии?\n\nНапишите \`да\` или \`нет\`.`).send();
        
        const collector = new MessageCollectorExp(msg.channel, {time: 20000, filter: [msg.author.id]});
        let b = false;
        collector.on("да", async (m) => {
            b = true;
            collector.stop();
            const newList = client.util.remove(thisGuild.helpers || [], {elements: [msg.author.id], indexes: []});

            await Promise.all([
                members.updateOne({_id: msg.author.id}, {$set: {
                    voice: 0
                }, $unset: {
                    guildName: ""
                }}),
                guilds.updateOne({name: thisGuild.name}, {$set: {helpers: newList}})
            ])
            Embed(msg).setSuccess("Вы успешно вышли из гильдии.").send();
            msg.member.roles.remove(thisGuild.roles)
        })

        collector.on("нет", async (m) => {
            b = true
            collector.stop();
            Embed(msg).setSuccess("Действие успешно отклонено.").send();
        })

        collector.end(() => {if (!b) Embed(msg).setError("Время вышло, попробуй снова!").send()});
       
    }
})