import { getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "delete-guild",
    aliases: ['dg', "delete"],
    description: "удалить свою гильдию",
    category: 1,
    cooldown: 5,
    async run({client, msg, prefix}) {
        const memberGuild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!memberGuild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        if (memberGuild.leader !== msg.author.id) return Embed(msg).setError("Вы не владелец этой гильдии.").send();
        
        await Embed(msg).setText("Вы уверены что хотите удалить свою гильдию, вся репутация будет потеряна?\n\nНапишите `да` или `нет`.").send();
        const name = memberGuild.name;
        const collector = new MessageCollectorExp(msg.channel, {time: 20000, filter: [msg.author.id]});
        let b = false;
        collector.on("да", async (m) => {
            b = true
            collector.stop();
            await Promise.all([
                members.updateMany({guildName: name}, {$set: {reputation: 0, voice: 0}, $unset: {guildName: ""}}),
                guilds.deleteOne({name: memberGuild.name})
            ])
            Embed(msg).setSuccess("Вы успешно удалили гильдию.").send();
        })

        collector.on("нет", async (m) => {
            b = true
            collector.stop();
            Embed(msg).setSuccess("Действие успешно отклонено.").send();
        })

        collector.end(() => {if (!b) Embed(msg).setError("Время вышло, попробуй снова!").send()});
    }
})