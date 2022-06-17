import { MessageEmbed } from "discord.js";
import { CURRENCY, GUILD_EMOJI } from "../../config";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand({
    name: "global-top",
    aliases: ["global"],
    description: "топ всех участников сервера",
    cooldown: 5,
    category: 2,
    async run({msg, client, prefix}) {
        const message = await Embed(msg).setText("🔃 | Генерирую глобальный топ...").send();
        const allMembers = await members.find({_id: {$in: msg.guild.members.cache.map((a, b) => a.id)}}).sort({points: -1});
        const texted = allMembers.map((obj, i) => {
            const member = msg.guild.members.cache.get(obj._id);

            return `**${i+1}.** ${member.user.tag} | ${CURRENCY.main} ${client.util.formatNumber(Math.round(obj.points))} | ${GUILD_EMOJI} ${obj.guildName ? obj.guildName : "Нет гильдии"}`;
        });
        const embeds: MessageEmbed[] = [];
        for (let i = 0; i < texted.length; i+=10) {
            const sliced = texted.slice(i, i+10);
            embeds.push(Embed(msg).setAuthor({name: `📊 | Топ сервера ${msg.guild.name}`}).setText(`Посмотреть статистику участника: \`${prefix}user-guild @Aeolian#0001\``).addField("👥 Участники", sliced.join("\n\n")).setThumbnail(msg.guild.iconURL({dynamic: true})));
        }

        if (embeds.length === 0) embeds.push(Embed(msg).setAuthor({name: `📊 | Топ сервера ${msg.guild.name}`}).setText(`Посмотреть статистику участника: \`${prefix}user-guild @Aeolian#0001\``).addField("👥 Участники", "Не найдены").setThumbnail(msg.guild.iconURL({dynamic: true})));

        await new Pagination({validIds: [msg.author.id], embeds, message: msg}).createAdvancedPagination().then(() => message.delete());
    }
})