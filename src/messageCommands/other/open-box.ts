import ms from "ms";
import { BOX_RANDOM_REWARD, BOX_VISUAL_TEXT, CURRENCY, DEFAULT_BOOST_AMOUNT } from "../../config";
import { findOrCreate, givePoints } from "../../database/db";
import { Member, members } from "../../database/models/memberSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "open-box",
    aliases: ["box"],
    description: "открыть бокс",
    category: 4,
    cooldown: 2,
    async run ({msg, methods, client}) {
        const id = msg.author.id;
        const thisMember = await findOrCreate("members", id) as Member;

        if (!thisMember.box || thisMember.box < 0) return methods.createError(msg, "У вас нет боксов!").send();

        const rewards = BOX_RANDOM_REWARD.sort((a, b) => a.chance - b.chance)

        const random = client.util.random(1, 100);

        let index = 0;
        while (random > rewards[index].chance) index++;

        const reward = rewards[index];

        await members.updateOne({_id: id}, {$inc: {box: -1}})
        if (reward.type === "boost") {
            const time = ms(client.util.random(reward.min, reward.max)+"m")
            if (thisMember.boost) {
                if(thisMember.boost.until > new Date()) {
                    await members.updateOne({_id: id}, {$set: {"boost.until": new Date(thisMember.boost.until.getTime() + time)}})
                } else {
                    await members.updateOne({_id: id}, {$set: {"boost.addX": DEFAULT_BOOST_AMOUNT, "boost.until": new Date(thisMember.boost.until.getTime() + time)}})
                }
            } else {
                await members.updateOne({_id: id}, {$set: {boost: {addX: DEFAULT_BOOST_AMOUNT, until: new Date(thisMember.boost.until.getTime() + time)}}})
            }

            return Embed(msg).setSuccess(BOX_VISUAL_TEXT.atBoost(`${DateTime.formatTime(DateTime.getTimeData(time, 0))}`)).send();
        } else if (reward.type === "xp") {
            const xp = client.util.random(reward.min, reward.max);

            await givePoints(id, xp, true);
            return Embed(msg).setSuccess(BOX_VISUAL_TEXT.atXp(`${CURRENCY.main} ${client.util.formatNumber(xp)}`)).send();
        }
        
    }
})