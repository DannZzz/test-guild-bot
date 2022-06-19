import { MessageEmbed } from "discord.js";
import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { Member } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand({
    name: "requests",
    aliases: ["req", "request"],
    description: "заявки в гильдию",
    category: 1,
    run: async ({ msg, methods, prefix }) => {
        const getThisMemberGuild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!getThisMemberGuild) return Embed(msg).setError(`Вы не состоите в гильдий.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        const fetch = await fetchGuild(getThisMemberGuild.name, { leader: true, helpers: true });

        const myId = msg.author.id;
        if (!hasPermissionsInGuild(getThisMemberGuild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();

        const filtered = fetch.Guild.requests.map((id, i) => `**${i + 1}.** ${msg.guild.members.cache.get(id) ? msg.guild.members.cache.get(id).user.tag : "Нет на сервере"}`);

        const embeds: MessageEmbed[] = [];

        let i = 0;
        while (i < filtered.length) {
            const sliced = filtered.slice(i, i + 10);
            embeds.push(Embed(msg).setAuthor({ name: `⁉ | Заявки ${fetch.Guild.name}` }).setThumbnail(fetch.Guild.logo).setText(`Принять: \`${prefix}accept <номер>\`\nОтклонить: \`${prefix}decline <номер>\`\n\n${sliced.join("\n")}`));
            i += 10;
        } 

        if (embeds.length === 0) embeds.push(Embed(msg).setAuthor({ name: `⁉ | Заявки ${fetch.Guild.name}` }).setThumbnail(fetch.Guild.logo).setText(`Принять: \`${prefix}accept <номер>\`\nОтклонить: \`${prefix}decline <номер>\`\n\nНет заявок :)`));

        await new Pagination({ embeds, validIds: [myId], message: msg }).createAdvancedPagination();

    }
})