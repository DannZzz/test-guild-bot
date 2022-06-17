import { Formatters } from "discord.js";
import ms from "ms";
import { findOrCreate } from "../../database/db";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "add-boost",
    category: 3,
    examples: ["{prefix}add-boost @Dann#2523 8h x1.5", "{prefix}add-boost 5489441698498497 20d x2"],
    master: true,
    description: "давать участнику временный буст очков",
    run: async ({client, args, msg, prefix, methods}): Promise<any> => {
        if (!args[0]) return methods.createError(msg, "Укажите участника сервера.", "add-boost").send();

        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return methods.createError(msg, "Участник сервера не найден!").send();

        if (!args[1] || !ms(args[1])) return methods.createError(msg, "Укажите время в нужном формате. (`1m, 1h, 1d`)", "add-boost").send();

        if (!args[2] || !args[2].startsWith("x") || isNaN(+args[2].slice(1))) return methods.createError(msg, "Укажите буст умножение в формате `xЧИСЛО`.", "add-boost").send();
        const until = new Date(Date.now() + ms(args[1]));
        await members.updateOne({_id: member.id}, {$set: {boost: {until, addX: +args[2].slice(1)} }})

        Embed(msg).setSuccess(`${member} получает **x${(+args[2].slice(1)).toFixed(1)}** буст до ${Formatters.time(until, "f")}.`).send();
    }
})