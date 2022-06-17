import { guilds } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "delete-all-ghosts",
    description: "удалить из базы все данные участников которых нет на сервере",
    permissions: "ADMINISTRATOR",
    category: 3,
    cooldown: 3,
    async run ({msg}) {
        await Embed(msg).setText("Вы уверены что хотите удалить все данные участников, которые вышли из сервера?\n\nНапишите `да` или `нет`.").send();
        const c = new MessageCollectorExp(msg.channel, {filter: [msg.author.id]});

        let b = false;
        c.on("да", async () => {
            b = true;
            c.stop();
            const message = await Embed(msg).setText("🔃 | Удаляю всех призраков...").send();
            const allGuilds = await guilds.find();
            const allGuildsLeaders = allGuilds.map(o => o.leader);
            const allMembers = await members.find();
            const allMembersIds = allMembers.map(o => o._id);
            const filtered = allMembersIds.filter(id => !msg.guild.members.cache.has(id) && !allGuildsLeaders.includes(id));
            await members.deleteMany({_id: {$in: filtered}})
            message.edit({embeds: [Embed(msg).setSuccess("Все призраки успешно удалены!")]});
        })

        c.on("нет", () => {
            b = true;
            c.stop();
            Embed(msg).setSuccess("Действие успешно отклонено.").send();
        })

        c.end(() => {if (!b) Embed(msg).setError("Время вышло, попробуйте снова.").send()})
    }
})