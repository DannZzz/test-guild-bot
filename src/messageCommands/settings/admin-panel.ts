import { EmojiResolvable, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { MessageCollectorExp } from "../../structures/Collector";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "admin-panel",
    description: "панель настроек для админов",
    examples: ["admin-panel Loyal"],
    cooldown: 5,
    category: 3,
    master: true,
    async run({ msg, sd, client, methods, args }) {

        if (!args[0]) return methods.createError(msg, "Укажите название гильдии.", "admin-panel").send();

        const guildName = args.join(" ");

        const Guild = await fetchGuild(guildName, { helpers: true, members: true, leader: true });
        if (!Guild.Guild) return Embed(msg).setError("Гильдия не найдена!").send();

        const menus = makeSelectMenusFromOptions([
            { label: "Изменить владельца", value: "edit-leader" },
            { label: "Изменить описание", value: "edit-description" },
            { label: "Изменить название", value: "edit-name" },
            { label: "Изменить логотип", value: "edit-logo" },
            { label: "Изменить лимит участников", value: "edit-limit" },
            { label: "Изменить доступность", value: "edit-privacy" },
            { label: "Роль, добавляющая в эту гильдию", value: "edit-role-add" },
            { label: "Кикнуть участника", value: "member-kick" },
            { label: "Повысить участника", value: "member-up" },
            { label: "Понизить участника", value: "member-down" },
            { label: "Удалить гильдию", value: "delete-guild" },
        ])


        const mainPanel = await Embed(msg)
            .setTitle("Быстрые действия с гильдиями")
            .setText("Выберите нужный вам параметр чтобы изменить.")
            .setFooter({ text: "Не спамить командой!" })
            .send(null, { components: createRows(menus) });

        const collector = mainPanel.createMessageComponentCollector({
            filter: i => i.user.id === msg.author.id,
            time: 30000,
            max: 1,
        })

        collector.on("end", () => {
            mainPanel.edit({ components: createRows(menus, true) })
        })

        collector.on("collect", async (i: SelectMenuInteraction): Promise<any> => {
            await i.deferUpdate()
            collector.stop();

            const customId = i.values[0];

            if (customId.startsWith("edit-")) {
                if (customId !== "edit-leader" && customId !== "edit-logo" && customId !== "edit-role-add") {
                    const expM = await Embed(msg).setText("Укажите новый параметр.").send();
                    const col = new MessageCollectorExp(msg.channel, { filter: [msg.author.id], time: 30000 });
                    col.on(null, (m => {
                        col.stop()
                        const _args = m.content.trim().split(/ +/g);
                        _args.unshift(customId.split("-")[1]);
                        const cmd = methods.getCommand("edit-guild");
                        cmd.run({ args: _args, msg: m, anyData: Guild.Guild, client, sd, methods })
                    }))

                    col.end(() => {
                        expM.delete();
                    })
                } else if (customId === "edit-logo") {
                    const expM = await Embed(msg).setText("Укажите новую ссылку или файл.").send();
                    const col = new MessageCollector(msg.channel, { filter: m => m.author.id === msg.author.id && (Boolean(m.content || m.attachments.first())), time: 30000 });
                    col.on("collect", (m => {
                        col.stop()
                        const _args = (m.content || "").trim().split(/ +/g);
                        _args.unshift(customId.split("-")[1]);
                        const cmd = methods.getCommand("edit-guild");
                        cmd.run({ args: _args, msg: m, anyData: Guild.Guild, client, sd, methods })
                    }))

                    col.on("end", () => {
                        expM.delete();
                    })
                } else if (customId === "edit-role-add") {
                    const expM = await Embed(msg).setText("Укажите новую роль, или `null` чтобы убрать.").send();
                    const col = new MessageCollectorExp(msg.channel, { filter: [msg.author.id], time: 30000 });
                    col.on(null, (async m => {
                        col.stop()
                        const _args = m.content.trim().split(/ +/g);
                        const role = m.mentions.roles.first() || msg.guild.roles.cache.get(_args[0]);
                        if (!role && _args[0] !== "null") return Embed(msg).setError("Роль не найдена!").send();
                        if (_args[0] === "null") {
                            await guilds.updateOne({name: guildName}, {$unset: {guildRole: ""}});
                            Embed(msg).setSuccess(`Роль успешно убрана!`).send();
                            return;
                        }
                        const isRoleAlreadyChosen = await guilds.findOne({guildRole: role.id});
                        if (isRoleAlreadyChosen) return Embed(msg).setError(`Эта роль уже выбрана для гильдии **${isRoleAlreadyChosen.name}**.`).send();
                        await guilds.updateOne({name: guildName}, {$set: {guildRole: role.id}});
                        Embed(msg).setSuccess(`Роль успешно установлена!`).send();
                    }))

                    col.end(() => {
                        expM.delete();
                    })
                } else {
                    const expM = await Embed(msg).setText("Укажите новoго участника.").send();
                    const col = new MessageCollectorExp(msg.channel, { filter: [msg.author.id], time: 30000 });
                    col.on(null, (async m => {
                        col.stop()
                        const member = m.mentions.members.first() || msg.guild.members.cache.get(m.content);
                        if (!member) return Embed(m).setError("Участник не найден!").send();
                        const memberGuild = await getMemberGuild(member.id) as GuildSchema;
                        if (memberGuild && memberGuild.name !== Guild.Guild.name) return Embed(msg).setError("Этот участник находиться в другой гильдии!").send();
                        await Promise.all([
                            guilds.updateOne({ name: Guild.Guild.name }, { $set: { leader: member.id } }),
                            members.updateOne({ _id: member.id }, { $set: { guildName: Guild.Guild.name } })
                        ])
                        Embed(msg).setSuccess("Новый лидер успешно установлен!")
                    }))

                    col.end(() => {
                        expM.delete();
                    })

                }
            } else if (customId === "delete-guild") {
                const _members = Guild.members;
                await Promise.all([
                    members.updateMany({ _id: { $in: _members.map(m => m._id) } }, { $set: { guildName: null } }),
                    guilds.deleteOne({ name: guildName })
                ])
                Embed(msg).setSuccess("Гильдия успешно удалена!").send();
            } else if (customId === "member-kick") {
                const expM = await Embed(msg).setText("Укажите участника.").send();
                const col = new MessageCollectorExp(msg.channel, { filter: [msg.author.id], time: 30000 });
                col.on(null, (async m => {
                    col.stop()
                    const member = m.mentions.members.first() || msg.guild.members.cache.get(m.content);
                    if (!member) return Embed(m).setError("Участник не найден!").send();
                    if (!Guild.members.find(x => x._id === member.id)) return Embed(m).setError("Это не участник этой гильдии").send();
                    if (Guild.leader._id === member.id) return Embed(m).setError("Нельзя кикнуть владельца.").send();
                    if (Guild.helpers.find(x => x._id === member.id)) {
                        const newList = Guild.helpers.filter(x => x._id !== member.id).map(x => x._id);
                        await Promise.all([
                            members.updateOne({ _id: member.id }, { $set: { guildName: null } }),
                            guilds.updateOne({name: guildName}, {$set: { helpers: newList }})
                        ]) 
                    } else {
                        await members.updateOne({ _id: member.id }, { $set: { guildName: null } })
                    }
                    Embed(msg).setSuccess("Участник успешно кикнут!").send();

                }))

                col.end(() => {
                    expM.delete();
                })
            } else if (["member-down", "member-up"].includes(customId)) {
                const expM = await Embed(msg).setText("Укажите участника.").send();
                const col = new MessageCollectorExp(msg.channel, { filter: [msg.author.id], time: 30000 });
                col.on(null, (async m => {
                    col.stop()
                    const cmd = methods.getCommand(customId);
                    cmd.run({msg: m, args: m.content.trim().split(/ +/g), client, sd, anyData: Guild.Guild, methods})
                }))

                col.end(() => {
                    expM.delete();
                })
            }

        })

    }
})


/**
    * Components --> Rows
    * 
    * @param components buttons or select menus
    * @param disabled are ther disabled
    */
function createRows(components: MessageButton[], disabled?: boolean): MessageActionRow[];
function createRows(components: MessageSelectMenu[], disabled?: boolean): MessageActionRow[];
function createRows(components: (MessageButton | MessageSelectMenu)[], disabled?: boolean): MessageActionRow[];
function createRows(components: (MessageButton | MessageSelectMenu)[] | MessageSelectMenu[] | MessageButton[], disabled: boolean = false): MessageActionRow[] {
    if (disabled) components.forEach(b => b.setDisabled(true));

    let rows = []
    for (let i = 0; i < components.length; i += 5) {
        const sliced = components.slice(i, i + 5);
        const buttons = sliced.filter(c => c.type === "BUTTON");
        const menus = sliced.filter(c => c.type === "SELECT_MENU");
        if (buttons?.length > 0) rows.push(new MessageActionRow().addComponents(buttons))
        if (menus?.length > 0) rows.push(new MessageActionRow().addComponents(menus))
    }
    return rows;
};

/**
     * Create simple menus from options
     * 
     * @param {MessageSelectOptionData[]} options menu's options
     * @param limitInOne maximum count of options in one menu
     * @returns menus array
     */
function makeSelectMenusFromOptions(options: MessageSelectOptionData[], limitInOne: number = 25,): MessageSelectMenu[] {
    const menus: MessageSelectMenu[] = [];
    for (let i = 0; i < options.length; i += limitInOne) {
        menus.push(
            new MessageSelectMenu()
                .setCustomId("any" + i)
                .setOptions(options.slice(i, limitInOne))
        )
    }
    return menus;
}