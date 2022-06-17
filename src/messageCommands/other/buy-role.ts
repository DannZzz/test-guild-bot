import { findOrCreate, givePoints } from "../../database/db";
import { Member } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "buy-role",
    aliases: ["br"],
    category: 4,
    description: "покупать роль из магазина",
    cooldown: 4,
    examples: ["{prefix}buy-role 4"],
    async run ({msg, sd, args, methods}) {
        if (!sd.roleShop || sd.roleShop.length === 0) return methods.createError(msg, "Магазин отстуствует..").send();

        if (!args[0] || isNaN(+args[0])) return methods.createError(msg, "Укажите номер роли из магазина.", "buy-role").send();

        const index = Math.round(+args[0]) - 1;

        const item = sd.roleShop[index];

        if (!item) return methods.createError(msg, `Роль с номеров **${index}** не найдена!`).send();

        if (msg.member.roles.cache.has(item.roleId)) return methods.createError(msg, "Вы уже имеете эту роль!").send();

        if (!msg.guild.me.permissions.has("MANAGE_ROLES")) return methods.createError(msg, "У меня недостаточно прав, обращайтесь к администрации!").send();
        const role = msg.guild.roles.cache.get(item.roleId);
        if (!role) return methods.createError(msg, "Роль не существует!").send();

        if (role.position >= msg.guild.me.roles.highest.position) return methods.createError(msg, "Эта роль выше меня, у меня нет прав!").send();

        const userData = await findOrCreate("members", msg.author.id) as Member;
        if (userData.points < item.cost) return methods.createError(msg, "У вас недостаточно средств.").send();
        try {
            await msg.member.roles.add(item.roleId)
            await givePoints(msg.author.id, -item.cost, true);
            return Embed(msg).setSuccess(`Поздравляю с покупкой роли!`).send();
        } catch (e) {
            console.log(e);
            methods.createError(msg, "Вышла ошбика, я не могу выдавать эту роль!").send();
        }
        
    }
})