import { MessageActionRow, MessageButton } from "discord.js";
import ms from "ms";
import { UNION_DECLINED_COOLDOWN } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "war",
    category: 1,
    cooldown: 3,
    description: "объявить или отменить войну",
    params: ["new", "cancel"],
    examples: ["{prefix}war new Марс", "{prefix}war cancel Марс"],
    async run({ client, msg, methods, args }) {
        const id = msg.author.id;
        const guild = await getMemberGuild(id) as GuildSchema;

        if (!guild) return Embed(msg).setError("Вы не состоите в гильдии.").send();

        if (guild.leader !== id) return Embed(msg).setError("Вы не лидер этой гильдии!").send();

        const type = args.shift();
        const name = args.join(" ");
        if (!["new", "cancel"].includes(type)) return methods.createError(msg, `Укажите \`new\`, чтобы объявить гильдию войну, либо \`cancel\`, чтобы предложить отменить войну!`).send();

        const specGuild = (await fetchGuild(name))?.Guild;
        if (!specGuild) return Embed(msg).setError("Гильдия не найдена!").send();
        if (specGuild.id === guild.id) return Embed(msg).setError("Укажите другую гильдию!").send();
        const myUnion = guild.union || [];
        const mUnion = specGuild.union || [];
        const myWar = guild.war || [];
        const mWar = specGuild.war || [];
        // if (myWar.includes(guild.id)) return Embed(msg).setError("Эта гильдия с вами уже воюет , действие не доступно!").send();

        if (type === "cancel") {

            if (!myWar.includes(specGuild.id)) return Embed(msg).setError("Вы не воюете с этой гильдии!").send();

            const message = await Embed(msg).setTitle("🏳 | Предложение отменить войну!").setText(`**${msg.guild.members.cache.get(specGuild.leader)?.user?.username || "Неизвестный"}**, Гильдия **${guild.name}** просит вам закончить войну.\n\nВы согласны?`).send(null, { components: [submitRow()] });
            const collector = message.createMessageComponentCollector({
                filter: i => i.user.id === specGuild.leader,
                time: 45 * 1000
            })

            let clicked = false;
            collector.on("end", () => {
                if (!clicked) {
                    message.edit({ components: [submitRow(true)], embeds: [Embed(msg).setTitle("🏳 | Предложение отменить войну!").setText(`**${msg.guild.members.cache.get(specGuild.leader)?.user?.username || "Неизвестный"}** не ответил..\n\nПопробуйте позже!`)] })
                }
            })

            collector.on("collect", async (b): Promise<any> => {
                await b.deferUpdate();

                clicked = true;
                collector.stop();
                if (b.customId === "said-yes") {
                    const myList = client.util.remove(myWar, { elements: [specGuild.id], indexes: [] });
                    const mList = client.util.remove(mWar, { elements: [guild.id], indexes: [] });

                    await Promise.all([
                        guilds.updateOne({ id: guild.id }, { $set: { war: myList } }),
                        guilds.updateOne({ id: specGuild.id }, { $set: { war: mList } })
                    ]);


                    message.edit({ components: [submitRow(true)], embeds: [Embed(msg).setSuccess(`Успешно завершена война между гильдиями **${guild.name}** и **${specGuild.name}**!`).setTitle("🏳 | Завершение войны!")] });
                } else {
                    message.edit({ components: [submitRow(true)], embeds: [Embed(msg).setError(`Лидер гильдии **${specGuild.name}** отказался закончить войну!`).setTitle("🏳 | Отклонено")] });
                }
            })
        } else {
            if (myWar.includes(specGuild.id)) return Embed(msg).setError("Вы уже воюете с этой гильдии!").send();
            if (myUnion.includes(specGuild.id)) return Embed(msg).setError("Эта гильдия ваш союзника, нельзя начинать войну!").send();
            if (!guild.war) await guilds.updateOne({ id: guild.id }, { $set: { war: [] } });
            if (!specGuild.war) await guilds.updateOne({ id: specGuild.id }, { $set: { war: [] } });
            await Promise.all([
                guilds.updateOne({ id: guild.id }, { $push: { war: specGuild.id } }),
                guilds.updateOne({ id: specGuild.id }, { $push: { war: guild.id } })
            ]);

            Embed(msg).setTitle(`❗ | Новая война`).setText(`**${guild.name}** объявила войну гильдию **${specGuild.name}**`).send();
        }

    }
})

export function submitRow(disable?: boolean): MessageActionRow {
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