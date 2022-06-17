import { Limiter } from "client-discord";
import { Collection, GuildMember } from "discord.js";
import { CURRENCY } from "../../config";
import { findOrCreate } from "../../database/db";
import { Member } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
const _rateLimiter = new Limiter(1, 1500);

export const _Auctions = new Collection<string, {bet: number, author?: string}>();

export default new MessageCommand({
    name: "create-auction",
    aliases: ["cra"],
    examples: ["{prefix}create-auction 5000", "{prefix}cra 20000 Админка"],
    category: 3,
    description: "создать аукцион на канале",
    master: true,
    async run({client, args, msg, methods, prefix, sd}) {

        msg.delete();
        if (!args[0] || isNaN(+args[0]) || +args[0] < 1) return methods.createError(msg, "Укажите начальную ставку.", "create-auction").send();

        let startBet = +args.shift();
        let author: GuildMember;
        const description = args.length === 0 ? "Не указано" : args.join(" ");

        const embed = () => Embed(msg).setFooter({text: `${prefix}bet <ставка> — Длительность: 15 сек.`}).setTitle("⚖ | Аукцион").setText(`**Описание:** ${description}`).addField("💰 | Текущая ставка", `${CURRENCY.main} ${client.util.formatNumber(startBet)}${author ? ` — ${author}` : ""}`)
        
        const _msg = await embed().send();
        
        
        const collector = msg.channel.createMessageCollector({
            time: 15 * 1000,
            filter: m => m.content && m.content.startsWith(`${prefix}bet `)
        })

        collector.on("end", () => {    
            _msg.edit({embeds: [embed().addField("🟠 Статус", "Закончен")]})
        })

        collector.on("collect", async (m): Promise<any> => {
            let bet = +(m.content.trim().split(/ +/g)[1]);
            m.delete();
            if (!bet || isNaN(bet)) return;
            const member = await findOrCreate("members", m.author.id) as Member;
            bet = Math.round(bet);
            if (bet <= startBet) return;
            if (member.points < bet) return methods.createError(m, "У вас недостаточно средств!").send().then(m => setTimeout(() => m.delete(), 5000));
            if (_rateLimiter.take(msg.channelId)) return;
            collector.resetTimer();
            startBet = bet;
            author = m.member;

            await _msg.edit({embeds: [embed()]});
            
        })
        
    },
})