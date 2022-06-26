import { MessageEmbed } from "discord.js";
import { CURRENCY, GUILD_EMOJI, GUILD_MEMBERS_MAX_SIZE } from "../../config";
import { fetchGuild } from "../../database/db";
import { guilds } from "../../database/models/guildSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand ({
    name: "top",
    aliases: ["guilds"],
    description: "топ гильдий",
    cooldown: 2,
    category: 2,
    async run ({client, prefix, msg}) {
        const message = await Embed(msg).setText("🔃 | Генерирую топ...").send();
        const allGuilds = await guilds.find();
        const got = await Promise.all(allGuilds.map(async x => {
            const fetch = await fetchGuild(x.name, {members: true});

            const voiceAll = Math.round(fetch.members.reduce((aggr, obj) => aggr + (obj.voice || 0), 0));
            const data = {...x};
            
            const members = fetch.members;
            const pointsAll = Math.round(fetch.members.reduce((aggr, obj) => aggr + obj.points ,0))
            return {...x, voiceAll, members, pointsAll};
        }))
        const texted: string[] = await Promise.all(got.sort((a, b) => b.pointsAll - a.pointsAll).map(async (obj, i) => {
            var privacy = "🔓";
            if (obj.privacy) privacy = "🔒";

            let remain = obj.voiceAll;
            
            return `**${i+1}.** ${privacy} ${obj.name} | 👥 ${obj.members.length} из ${GUILD_MEMBERS_MAX_SIZE || 500} | ${CURRENCY.main} ${client.util.formatNumber(obj.pointsAll)} | 🎙 ${DateTime.toStringWithZero(remain)}`;
            })
        );
        
        const embeds: Array<MessageEmbed> = [];
        for (let i = 0; i < texted.length; i += 10) {
            const sliced = texted.slice(i, i+10);
            embeds.push(Embed(msg).setAuthor({name: `Гильдии сервера ${msg.guild.name}`}).setThumbnail(msg.guild.iconURL({dynamic: true})).setText(`Вступить в гильдию: \`${prefix}join-guild <название гильдии>\``).addField(`${GUILD_EMOJI} | Гильдии`, sliced.join("\n\n")));
        };

        if (embeds.length === 0) embeds.push(Embed(msg).setAuthor({name: `Гильдии сервера ${msg.guild.name}`}).setThumbnail(msg.guild.iconURL({dynamic: true})).setText(`Вступить в гильдию: \`${prefix}join-guild <название гильдии>\``).addField("${GUILD_EMOJI} | Гильдии", "Не найдены"));

        await new Pagination({message: msg, embeds, validIds: [msg.author.id]}).createAdvancedPagination().then(() => message.delete());
    }
})
