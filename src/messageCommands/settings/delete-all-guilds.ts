import { guilds } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "delete-all-guilds",
    description: "удалить все гильдии",
    category: 3,
    permissions: "ADMINISTRATOR",
    cooldown: 3,
    async run({ client, msg }) {
        await Embed(msg).setText("Вы уверены что хотите удалить все гильдии сервера?\n\nНапишите `да` или `нет`.").send();
        const c = new MessageCollectorExp(msg.channel, { filter: [msg.author.id] });
        
        let b = false;
        c.on("да", async () => {
            b = true
            c.stop()
            await Promise.all([
                guilds.deleteMany(),
                members.updateMany({}, { $unset: { guildName: "" } })
            ])
            Embed(msg).setSuccess("Все гильдии успешно удалены!").send()
        });

        c.on("нет", async () => {
            b = true
            c.stop()
            Embed(msg).setSuccess("Действие успешно отклонено!").send();
        })

        c.end(() => {if (!b) Embed(msg).setError("Время вышло, попробуйте снова!").send()})
    }
})