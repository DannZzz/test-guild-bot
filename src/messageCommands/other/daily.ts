import { CURRENCY, ONE_DAY_REWARD } from "../../config";
import { findOrCreate, givePoints } from "../../database/db";
import { Member, members } from "../../database/models/memberSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "daily",
    description: "получить ежедневную награду",
    category: 4,
    async run ({sd, msg, client}) {
        const memberData = await findOrCreate("members", msg.author.id) as Member;
        const daily = memberData.daily;
        let reward: number, day: number;
        const oneDay = 86400000;
        if (!daily || !daily.last || !daily.day) {

            reward = ONE_DAY_REWARD;
            day = 1;
            await Promise.all([
                givePoints(msg.author.id, reward, true),
                members.updateOne({_id: msg.author.id}, {$set: {daily: {last: new Date(Date.now() + oneDay), day} }})
            ])
            
        } else {
            if (new Date(daily.last.getTime() + oneDay) < new Date()) {
                reward = ONE_DAY_REWARD;
                day = 1
                await Promise.all([
                    givePoints(msg.author.id, reward, true),
                    members.updateOne({_id: msg.author.id}, {$set: {daily: {last: new Date(Date.now() + oneDay), day} }})
                ])
            } else if (daily.last > new Date()) {
                // Рано
                day = daily.day;
                return Embed(msg)   
                    .setAuthor({name: `День: ${day}`})
                    .setError(`Вернитесь через ${DateTime.formatTime(DateTime.getTimeData(daily.last.getTime()))}`)
                    .send()

            } else {
                day = daily.day + 1;
                reward = (day % 7 === 0 ? 7 : day % 7) * ONE_DAY_REWARD;
                await Promise.all([
                    givePoints(msg.author.id, reward, true),
                    members.updateOne({_id: msg.author.id}, {$set: {daily: {last: new Date(Date.now() + oneDay), day} }})
                ])
            }
        }

        Embed(msg).setSuccess(`Вы получили ${CURRENCY.main} ${client.util.formatNumber(reward)}, вернитесь завтра!`).setAuthor({name: `День: ${day}`}).send()
    }
})