import { EmojiResolvable, MessageEmbed } from "discord.js";
import { CURRENCY, GUILD_HELPER_EMOJI, GUILD_LEADER_EMOJI } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand({
    name: "guild-members",
    description: "посмотреть участников гильдии",
    aliases: ["gm"],
    examples: ["{prefix}gm Топы"],
    category: 2,
    cooldown: 2,
    run: async ({ msg, prefix, methods, args, client }) => {
        var guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!args[0] && !guild) return methods.createError(msg, "Укажите название гильдии.", "guild-members").send();
        var name = guild?.name;
        if (args[0]) name = args.join(" ");
        const fetch = await fetchGuild(name, { members: true, helpers: true, leader: true });
        guild = fetch.Guild
        if (!guild) return Embed(msg).setError(`Гильдия не найдена.\nПопробуйте: \`${prefix}top\``).send();
        
        const texted: string[] = fetch.members.sort((a, b) => b.points - a.points).map((obj, i) => {
            const member = msg.guild.members.cache.get(obj._id);
            var emoji: EmojiResolvable;

            if (obj._id === fetch.leader._id) {
                emoji = GUILD_LEADER_EMOJI || "💠";
            } else if (fetch.helpers.map(o => o._id).includes(obj._id)) {
                emoji = GUILD_HELPER_EMOJI || "🔶";
            } else {
                emoji = "";
            }

            var name = member ? member.user.username : `Вышел(${obj._id})`;

            let remain = obj.voice || 0;
            return `**${i+1}.** ${emoji} ${name} | ${CURRENCY.main} ${client.util.formatNumber(Math.round(obj.points))} | 🎙 ${DateTime.toStringWithZero(remain)}`;
        });

        let i = 0;
        const embeds: MessageEmbed[] = [];
        while (i < texted.length) {
            const sliced = texted.slice(i, i+10);
            embeds.push(Embed(msg)
                .setAuthor({name: `Участники ${guild.name}`})
                .setThumbnail(guild.logo)
                .setText(`Посмотреть гильдию: \`${prefix}guild-info ${guild.name}\``)
                .addField("👥 Участники", sliced.join("\n\n")));
            i += 10;
        }

        if (embeds.length === 0) embeds.push(Embed(msg)
        .setAuthor({name: `Участники ${guild.name}`})
        .setThumbnail(guild.logo)
        .setText(`Посмотреть гильдию: \`${prefix}guild-info ${guild.name}\``)
        .addField("👥 Участники", "Не найдены :)"));
        
        await new Pagination({embeds, validIds: [msg.author.id], message: msg}).createAdvancedPagination();
    }
})