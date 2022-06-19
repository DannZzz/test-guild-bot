import { MessageActionRow, MessageButton } from "discord.js";
import ms from "ms";
import { UNION_DECLINED_COOLDOWN } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
type GuildId = string;
const UnionCooldowns = new Set<GuildId>()

export default new MessageCommand ({
    name: "union",
    category: 1,
    cooldown: 3,
    description: "предложить/разбить союз",
    params: ["new", "cancel"],
    examples: ["{prefix}union new Марс", "{prefix}union cancel Марс"],
    async run ({client, msg, methods, args}) {
        const id = msg.author.id;
        const guild = await getMemberGuild(id) as GuildSchema;

        if (!guild) return Embed(msg).setError("Вы не состоите в гильдии.").send();

        if (guild.leader !== id) return Embed(msg).setError("Вы не лидер этой гильдии!").send();

        const type = args.shift();
        const name = args.join(" ");
        if (!["new", "cancel"].includes(type)) return methods.createError(msg, `Укажите \`new\`, чтобы предложить гильдию союз, либо \`cancel\`, чтобы расторгнуть союз!`).send();

        const specGuild = (await fetchGuild(name))?.Guild;
        if (!specGuild) return Embed(msg).setError("Гильдия не найдена!").send();
        if (specGuild.id === guild.id) return Embed(msg).setError("Укажите другую гильдию!").send();
        const myUnion = guild.union || [];
        const mUnion = specGuild.union || [];
        const myWar = guild.war || [];
        const mWar = specGuild.war || [];
        if (mWar.includes(guild.id)) return Embed(msg).setError("Эта гильдия объявила вам войну, действие не доступно!").send();
        if (myWar.includes(specGuild.id)) return Embed(msg).setError("Вы объявили этой гильдии войну, действие не доступно!").send();
        
        if (type === "new") {
            // COoldown
            if (UnionCooldowns.has(guild.id)) return Embed(msg).setError("Вы уже отправили предложение, дождитесь ответа, прежде чем отправить новую.").send();
            if (guild?.cooldowns?.union > new Date()) return Embed(msg).setError(`Вам недавно отказали, подождите еще ${DateTime.formatTime(DateTime.getTimeData(guild.cooldowns.union.getTime()))}`).send()
            
            if (myUnion.includes(specGuild.id)) return Embed(msg).setError("Вы уже состоите в союзе с этой гильдии!").send();

            
            UnionCooldowns.add(guild.id);
            const message = await Embed(msg).setTitle("🤝 | Предложение нового союза!").setText(`**${msg.guild.members.cache.get(specGuild.leader)?.user?.username || "Неизвестный"}**, Гильдия **${guild.name}** предлагает вам заключить союз.\n\nСогласны вы?`).send(null, {components: [submitRow()]});
            const collector = message.createMessageComponentCollector({
                filter: i => i.user.id === specGuild.leader,
                time: 45 * 1000
            })

            let clicked = false;
            collector.on("end", () => {
                UnionCooldowns.delete(guild.id);
                if (!clicked) {
                    message.edit({components: [submitRow(true)], embeds: [Embed(msg).setTitle("🤝 | Предложение нового союза!").setText(`**${msg.guild.members.cache.get(specGuild.leader)?.user?.username || "Неизвестный"}** не ответил..\n\nПопробуйте позже!`)]})
                }
            })

            collector.on("collect", async (b): Promise<any> => {
                await b.deferUpdate();

                clicked = true;
                collector.stop();
                if (b.customId === "said-yes") {
                    if (!guild.union) await guilds.updateOne({id: guild.id}, {$set: {union: []}});
                    if (!specGuild.union) await guilds.updateOne({id:specGuild.id}, {$set: {union: []}});
                    await Promise.all([
                        guilds.updateOne({id: guild.id}, {$push: {union: specGuild.id}}),
                        guilds.updateOne({id: specGuild.id}, {$push: {union: guild.id}})
                    ]);
                    message.edit({components: [submitRow(true)], embeds: [Embed(msg).setSuccess(`Успешно заключён союз между гильдиями **${guild.name}** и **${specGuild.name}**!`).setTitle("🤝 | Новый союз!")]});
                } else {
                    await guilds.updateOne({id: guild.id}, {$set: {"cooldowns.union": new Date(Date.now() + ms(UNION_DECLINED_COOLDOWN))}});
                    message.edit({components: [submitRow(true)], embeds: [Embed(msg).setSuccess(`Лидер гильдии **${specGuild.name}** отказался заключить союз с вами!`).setTitle("🤝 | Предложение отклонено")]});
                }
            })
        } else {
            if (!myUnion.includes(specGuild.id)) return Embed(msg).setError("Вы не состоите в союзе с этой гильдии!").send();
            const myList = client.util.remove(myUnion, {elements: [specGuild.id], indexes: []});
            const mList = client.util.remove(mUnion, {elements: [guild.id], indexes: []});

            await Promise.all([
                guilds.updateOne({id: guild.id}, {$set: {union: myList}}),
                guilds.updateOne({id: specGuild.id}, {$set: {union: mList}})
            ]);

            Embed(msg).setTitle(`❗ | Изменение союза`).setText("Союз расторгнут!").send();
        }

    }
})

export function submitRow (disable?: boolean): MessageActionRow {
    const buttons = [
        new MessageButton()
            .setDisabled(disable ? true : false)
            .setCustomId("said-yes")
            .setLabel("Да")
            .setStyle("SUCCESS"),
        new MessageButton()
            .setDisabled(disable ? true : false)
            .setCustomId("said-no")
            .setLabel("Нет")
            .setStyle("DANGER")
    ]


    return new MessageActionRow().addComponents(buttons);
}