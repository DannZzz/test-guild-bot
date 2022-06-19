import { ButtonInteraction, Collection, ColorResolvable, MessageActionRow, MessageButton, MessageCollector, MessageEmbed, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction, TextChannel, Webhook } from "discord.js";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import validUrl from "valid-url";

export default new MessageCommand ({
    name: "send-webhook",
    aliases: ["webhook"],
    description: "отправлять сообщения через вебхуков",
    category: 3,
    permissions: "MANAGE_WEBHOOKS",
    async run ({msg, args, client, methods}) {
        const channel = (msg.mentions.channels.first() || msg.guild.channels.cache.get(args[0]) || msg.channel) as TextChannel;
        if (!channel.permissionsFor(msg.member).has("VIEW_CHANNEL")) return Embed(msg).setError("У вас недостаточно прав.").send();
        let webhooks: Collection<string, Webhook>
        try {
            webhooks = await channel.fetchWebhooks();
        } catch {
            return Embed(msg).setError("У меня недостаточно прав.").send(5000)
        }

        if ((webhooks.size || 0) === 0) return Embed(msg).setText(`Канал **${channel.name}** нев имеет вебхуков!`).send();

        const menus = makeSelectMenusFromOptions(webhooks.map(webhook => {
            return {
                value: webhook.id,
                label: webhook.name
            }
        }))

        const ended = Embed(msg).setError("Таймаут...");
        
        const rows1 = createRows(menus);

        const message = await Embed(msg).setText("Выберите нужный вам вебхук.").send(undefined, { components: rows1 });
        const collector = message.createMessageComponentCollector({
            filter: i => menus.map(b => b.customId).includes(i.customId) && i.user.id === msg.author.id,
            time: 30000
        });

        let b1 = false;

        collector.on("end", () => {
            if (!b1) message.edit({ embeds: [ended], components: [] });
        })

        collector.on("collect", async (i: SelectMenuInteraction): Promise<any> => {
            await i.deferUpdate();
            const webhookId = i.values[0];

            const webhook = (await channel.fetchWebhooks()).find(w => w.id === webhookId);
            if (!webhook) {
                collector.resetTimer()
                return Embed(msg).setError("Вебхук не найден!").send();
            }
            
            b1 = true;
            collector.stop();

            const buttons = [
                new MessageButton()
                    .setCustomId("content")
                    .setLabel("Контент")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("image")
                    .setLabel("Большая картинка")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("thumbnail")
                    .setLabel("Маленькая картинка")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("description")
                    .setLabel("Описание")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("title")
                    .setLabel("Заголовка")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("color")
                    .setLabel("Цвет")
                    .setStyle("SECONDARY"),
            ]

            const sendAndClear = [
                new MessageButton()
                    .setCustomId("send")
                    .setLabel("Отправить")
                    .setStyle("SUCCESS"),
                new MessageButton()
                    .setCustomId("edit")
                    .setLabel("Изменить сообщение")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("clear")
                    .setLabel("Очистить по умолчанию")
                    .setStyle("DANGER"),
            ]

            const rows = [...createRows(buttons), ...createRows(sendAndClear)];
            const ids = [...buttons.map(b => b.customId), ...sendAndClear.map(b => b.customId)];

            var embed = new MessageEmbed().setDescription("Тут описание");
            let content: string = null
            await message.edit({embeds: [embed], components: rows, content});
            
            const c = message.createMessageComponentCollector({
                filter: i => i.user.id === msg.author.id && ids.includes(i.customId),
                time: 60000 * 3
            })
            var b = false;
            
            c.on("end", () => {
                if (!b) {
                    message.edit({embeds: [ended], components: [], content})
                }
            })

            c.on("collect", async (i: ButtonInteraction) => {
                await i.deferUpdate();
                c.resetTimer();
                if (i.customId === "send") {
                    try {
                        await webhook.send({
                            embeds: [embed],
                            content
                        })
                        Embed(msg).setSuccess("Сообщение отправлено!").send(5000);
                    } catch (e) {
                        Embed(msg).setError("Ошибка, возможно у меня нет прав!").send(5000);
                    }
                } else if (i.customId === "clear") {
                    embed = new MessageEmbed().setDescription("Тут описание");
                    content = null;
                    await message.edit({embeds: [embed], content});
                    Embed(msg).setSuccess("Чистим..").send(5000);
                } else if (i.customId === "description") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте описание, у вас минута!")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md) => {
                        
                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            c.resetTimer();
                            embed.setDescription(client.util.shorten(md.content, 4096));
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Описание - ОК!").send(5000);
                        } else {
                            cd.resetTimer();
                        }
                    })
                } else if (i.customId === "image") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте фотку или ссылку, у вас минута!")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md): Promise<any> => {
                        c.resetTimer();

                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            if (!validUrl.isUri(md.content)) {
                                return Embed(msg).setError("Недопустимая ссылка!").send(5000);
                            }
                            embed.setImage(md.content);
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Image - OK!").send(5000);
                        } else if (md?.attachments?.size > 0) {
                            const attachment = md.attachments.first();
                            b2 = true;
                            cd.stop();
                            embed.setImage(`${attachment.url || attachment.proxyURL}`);
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Image - OK!").send(5000);
                        } else {
                            cd.resetTimer()
                        }
                    })
                } else if (i.customId === "thumbnail") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте фотку или ссылку, у вас минута!")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md): Promise<any> => {
                        c.resetTimer();

                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            if (!validUrl.isUri(md.content)) {
                                return Embed(msg).setError("Недопустимая ссылка!").send(5000);
                            }
                            embed.setThumbnail(md.content);
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Thumbnail - OK!").send(5000);
                        } else if (md?.attachments?.size > 0) {
                            const attachment = md.attachments.first();
                            b2 = true;
                            cd.stop();
                            embed.setThumbnail(`${attachment.url || attachment.proxyURL}`);
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Thumbnail - OK!").send(5000);
                        } else {
                            cd.resetTimer()
                        }
                    })
                } else if (i.customId === "title") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте текст, у вас минута")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md) => {
                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            c.resetTimer();
                            embed.setTitle(client.util.shorten(md.content, 256));
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Заголовка - ОК!").send(5000);
                        } else {
                            cd.resetTimer();
                        }
                    })
                } else if (i.customId === "edit") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте ID сообщений, чтобы изменить на эту, у вас минута!")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md): Promise<any> => {
                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            c.resetTimer();
                            const id = md.content.trim().split(/ /g)[0];
                            
                            const needMessage = await channel.messages.fetch(id);
                            if (!needMessage) return Embed(msg).setError("Сообщение не найдено!").send(5000);
                            await webhook.editMessage(needMessage, {embeds: [embed], content});
                            Embed(msg).setSuccess("Сообщение - изменено!").send(5000);
                        } else {
                            cd.resetTimer();
                        }
                    })
                }else if (i.customId === "color") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте цвет для EMBED (`#f0f0f0`), у вас минута!")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md) => {
                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            c.resetTimer();
                            embed.setColor(md.content as ColorResolvable);
                            await message.edit({embeds: [embed]});
                            Embed(msg).setSuccess("Цвет - ОК!").send(5000);
                        } else {
                            cd.resetTimer();
                        }
                    })
                }else if (i.customId === "content") {
                    const m = await msg.channel.send({embeds: [Embed(msg).setText("Отправьте текст, у вас минута!")]})
                    const cd = new MessageCollector(msg.channel, {filter: m => m.author.id === msg.author.id, time: 60000});
                    let b2 = false
                    cd.on("end", () => {
                        if (!b2) m.edit({embeds: [ended]});
                        m.delete();
                    });

                    cd.on("collect", async (md) => {
                        md.delete();
                        if (md.content) {
                            b2 = true;
                            cd.stop();
                            c.resetTimer();
                            content = md.content;
                            await message.edit({content});
                            Embed(msg).setSuccess("Контент - ОК!").send(5000);
                        } else {
                            cd.resetTimer();
                        }
                    })
                }
            })

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
function makeSelectMenusFromOptions(options: MessageSelectOptionData[], limitInOne: number = 25,) {
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