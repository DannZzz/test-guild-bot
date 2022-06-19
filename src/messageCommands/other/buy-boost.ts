import ms from "ms";
import { BOOST_SHOP, DEFAULT_BOOST_AMOUNT } from "../../config";
import { findOrCreate, givePoints } from "../../database/db";
import { Member, members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "buy-boost",
    aliases: ["bb"],
    category: 4,
    description: "купить временный буст профиля",
    cooldown: 4,
    async run ({args, msg, client, methods}) {
        if (!args[0] || isNaN(+args[0])) return methods.createError(msg, "Укажите номер тарифа из магазина.", "buy-boost").send();

        const index = Math.round(+args[0]) - 1;
        const item = BOOST_SHOP[index];
        if (!item) return methods.createError(msg, "Товар не найден.").send();

        const thisMember = await findOrCreate("members", msg.author.id) as Member;

        if (thisMember.points < item.cost) return methods.createError(msg, "У вас недостаточно средств!").send();

        if (thisMember.boost) {
            if(thisMember.boost.until > new Date()) {
                await members.updateOne({_id: msg.author.id}, {$set: {"boost.until": new Date(thisMember.boost.until.getTime() + ms(item.duration))}})
            } else {
                await members.updateOne({_id: msg.author.id}, {$set: {"boost.addX": DEFAULT_BOOST_AMOUNT, "boost.until": new Date(thisMember.boost.until.getTime() + ms(item.duration))}})
            }
        } else {
            await members.updateOne({_id: msg.author.id}, {$set: {boost: {addX: DEFAULT_BOOST_AMOUNT, until: new Date(thisMember.boost.until.getTime() + ms(item.duration))}}})
        }
        await givePoints(msg.author.id, -item.cost, true);
        Embed(msg).setSuccess("Вы успешно купили Буст Профиля!").send();
        
    }
})