import { MessageActionRow, MessageButton } from "discord.js";
import { CURRENCY } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "invite",
    aliases: ["inv"],
    description: "отправить приглашение в чат",
    category: 2,
    cooldown: 5,
    async run ({msg, client, prefix}) {
        const guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!guild) return Embed(msg).setError(`Вы не состоите в гильдию.\nВсе гильдии сервера: \`${prefix}top\``).send();
        const button = new MessageButton()
            .setCustomId(`invite-${guild.name}`)
            .setStyle("SECONDARY")
            .setEmoji("🚪")
            .setLabel("Войти");

        const fetch = await fetchGuild(guild.name, {members: true});
        
        Embed(msg)
        .setAuthor({name: "🚩 | Приглашение"})
        .setText(`Вас приглашают в гильдию **${guild.name}**!\nНажмите 🚪 внизу, чтобы войти.`)
        .addField(`${CURRENCY.main} Всего опыта`, `> ${client.util.formatNumber(Math.round(fetch.members.reduce((aggr, obj) => aggr + obj.points, 0)))}`)
        .setThumbnail(guild.logo)
        .send(undefined, {components: [new MessageActionRow().addComponents([button])]})
    }
})