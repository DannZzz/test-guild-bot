import { MessageEmbed } from "discord.js";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand({
    name: "guild-voice",
    aliases: ["gv"],
    description: "топ голосовому активностью гильдии",
    examples: ["{prefix}guild-voice Лучшие из лучших"],
    category: 2,
    cooldown: 2,
    async run({ client, prefix, msg, args, methods }) {
        var guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!args[0] && !guild) return methods.createError(msg, "Укажите название гильдии.", "guild-voice").send();
        var name = guild?.name;
        if (args[0]) name = args.join(" ");
        const fetch = await fetchGuild(name, { members: true });
        guild = fetch.Guild
        if (!fetch) return Embed(msg).setError("Гильдия не найдена.").send();
        const texted: string[] = fetch.members.sort((a, b) => b.voice - a.voice).map((obj, i) => {
            let remain = obj.voice;
            
            var name = "Вышел";
            const member = msg.guild.members.cache.get(obj._id);
            if (member) name = member.user.tag;
            return `**${i+1}.** ${name} | 🎙 ${DateTime.toStringWithZero(remain || 0)}`;
        });

        const embeds: MessageEmbed[] = [];
        for(let i = 0; i < texted.length; i += 10) {
            const sliced = texted.slice(i, i+10);
            embeds.push(
                Embed(msg)
                .setThumbnail(fetch.Guild.logo)
                .setAuthor({name: `Топ участников ${fetch.Guild.name}`})
                .setText(`Вступить в гильдию: \`${prefix}join-guild <название гильдии>\``)
                .addField("🎙 Топ по голосовому активностью", sliced.join("\n\n"))
            )
        }

        if (embeds.length === 0) embeds.push(
            Embed(msg)
            .setThumbnail(fetch.Guild.logo)
            .setAuthor({name: `Топ участников ${fetch.Guild.name}`})
            .setText(`Вступить в гильдию: \`${prefix}join-guild <название гильдии>\``)
            .addField("🎙 Топ по голосовому активностью", "Не найдены")
        )

        await new Pagination({message: msg, embeds, validIds: [msg.author.id]}).createAdvancedPagination();
    }
})