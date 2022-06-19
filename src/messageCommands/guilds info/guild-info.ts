import { CURRENCY, GUILD_DESCRIPTION_MAX_LENGTH, GUILD_EMOJI, GUILD_HELPER_EMOJI, GUILD_LEADER_EMOJI, GUILD_MEMBERS_MAX_SIZE } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import client from "../../structures/Client";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "guild-info",
    aliases: ["guild", "gi"],
    description: "посмотреть статистику гильдии",
    examples: ["{prefix}gi Топы"],
    category: 2,
    cooldown: 2,
    run: async ({ msg, prefix, methods, args }) => {
        var guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!args[0] && !guild) return methods.createError(msg, "Укажите название гильдии.", "guild-info").send();
        var name = guild?.name;
        if (args[0]) name = args.join(" ");
        const fetched = await fetchGuild(name, { members: true, helpers: true });
        guild = fetched.Guild
        if (!guild) return Embed(msg).setError(`Гильдия не найдена.\nПопробуйте: \`${prefix}top\``).send();
        // console.log(fetched.members);
        const voiceAll = Math.round(fetched.members.reduce((aggr, obj) => aggr + (obj.voice || 0), 0));

        

        const awards = guild.awards;

        let unions = await Promise.all((guild.union || []).map(async x => {
            const g = await guilds.findOne({id: x});
            if (g) return g.name;
        }))
        
        const union = unions.length > 0 ? unions.join(", ") : "Нету";

        let wars = await Promise.all((guild.war || []).map(async x => {
            const g = await guilds.findOne({id: x});
            if (g) return g.name;
        }))
        
        const war = wars.length > 0 ? wars.join(", ") : "Нету";
        
        const main = Embed(msg)
            .setAuthor({ name: `${GUILD_EMOJI} | ${guild.name}`})
            .setThumbnail(guild.logo)
            .setText(`Топ участников: \`${prefix}guild-top ${guild.name}\`\nГолосовая активность: \`${prefix}guild-voice ${guild.name}\`\n\n${fetched.Guild.description ? "> " + client.util.shorten(fetched.Guild.description, (GUILD_DESCRIPTION_MAX_LENGTH || 200)) : "> Описание отсутствует..."}`)
            .addField((GUILD_LEADER_EMOJI || "💠") + " Владелец", `> ${msg.guild.members.cache.get(guild.leader as string) ? msg.guild.members.cache.get(guild.leader as string).user.tag : "Вышел из сервера"}`)
            .addField(`${GUILD_HELPER_EMOJI || "🔶"} Помощники`, `> ${fetched.helpers.map(helper => msg.guild.members.cache.has(helper._id) ? msg.guild.members.cache.get(helper._id).user.tag : "Вышел")?.join(", ") || "Нету"}`)
            .addField("👥 Участники", `> ${fetched.members.length} из ${guild.limit || GUILD_MEMBERS_MAX_SIZE || 500}`)
            .addField(`${CURRENCY.main} Всего опыта`, `> ${client.util.formatNumber(Math.round(fetched.members.reduce((aggr, obj) => aggr + (obj.points || 0), 0)))}`)
            .addField("🎙 Голосовая активность", `> ${DateTime.toStringWithZero(voiceAll)}`)
            .addField(`🤝 Союзники`, `> ${union}`)
            .addField(`⚔ Враги`, `> ${war}`)


        if (awards.length > 0) {
            let obj = {};
            const awardsTexted = []
            for (let i of awards) {
                if (obj[i]) {
                    obj[i]++
                } else {
                    obj[i] = 1
                }
            }

            for (let key in obj) {
                awardsTexted.push(`${key} \`x${obj[key]}\``);
            }

            main.addField("🏆 Награды", `> ${awardsTexted.join(" | ")}`)
        }

        if (guild.roles) {
            const validRoles = guild.roles.map(s => {
                const role = msg.guild.roles.cache.get(s);
                if (role) return role;
            });
            if (validRoles.length > 0) main.addField("🎗 Роли", `> ${validRoles.join(", ")}`);
        }

        if (guild.guildRole) {
            const role = msg.guild.roles.cache.get(guild.guildRole);
            if (role) main.addField(`🥏 Роль, добавляющая в эту гильдию`, `> ${role} = участник`)
        }
        
        if (guild.privacy) main.addField("🔒 Приватность", `> Вступление по заявкам.\n> Всего заявок — ${guild.requests.length}`);
        
        main.send();
    }
})