import { GUILD_DESCRIPTION_MAX_LENGTH, GUILD_MEMBERS_MAX_SIZE, GUILD_NAME_MAX_LENGTH } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import validUrl from "valid-url";

export default new MessageCommand ({
    name: "edit-guild",
    aliases: ["eg"],
    category: 1,
    cooldown: 5,
    params: ["description", "logo", "name", "limit", "privacy"],
    examples: ["{prefix}edit-guild description Самая лучшая гильдия!", "{prefix}edit-guild logo https://imgur/photo.png", "{prefix}edit-guild name Топеры", "{prefix}edit-guild limit 100", "{prefix}edit-guild privacy on/off"],
    description: "изменить гильдию",
    run: async ({args, methods, client, msg, anyData}) => {
        const eg = methods.getCommand("edit-guild");

        let guild: GuildSchema;
        if (anyData) {
            guild = anyData;
        } else {
            guild = await getMemberGuild(msg.author.id) as GuildSchema;
            if (!guild) return Embed(msg).setError("Вы не состоите в гильдии.").send();
            if (guild.leader !== msg.author.id) return Embed(msg).setError("Вы не лидер этой гильдии.").send();
        }
        
        const param1 = args[0]?.toLowerCase();
        if (!param1 || !eg.params.includes(param1)) return methods.createError(msg, "Укажите параметр: " + `\`${eg.params.join(", ")}\``, eg.name).send();
        const params = args.slice(1);
        switch (param1) {
            case "description": {
                if (!params[0]) return methods.createError(msg, "Укажите новое описание.", eg.name).send();
                const description = params.join(" ");
                if (description.length > (GUILD_DESCRIPTION_MAX_LENGTH || 200)) return Embed(msg).setError(`Максимальная длина описаний - ${GUILD_DESCRIPTION_MAX_LENGTH || 200} символов.`).send();
                await guilds.updateOne({name: guild.name}, {$set: {description}});
                Embed(msg).setSuccess("Описание успешно обновлено.").send();
                break;
            }

            case "logo": {
                if (!params[0] && !msg.attachments.first()) return methods.createError(msg, "Укажите ссылку или файл на логотип.", eg.name).send();
                const att = msg.attachments.first();
                const link = params[0] || att.url || att.proxyURL;
                if (!validUrl.isUri(link)) return Embed(msg).setError("Ссылка не доступная.").send();
                await guilds.updateOne({name: guild.name}, {$set: {logo: link}});
                Embed(msg).setSuccess("Логотип успешно обновлён").send();
                break;
            }

            case "name": {
                if (!params[0]) return methods.createError(msg, "Укажите новое название.", eg.name).send();
                const name = params.join(" ");
                if (name.length > (GUILD_NAME_MAX_LENGTH || 25)) return methods.createError(msg, `Максимальная длина для названий гильдий - ${GUILD_NAME_MAX_LENGTH || 25} символов.`, "create-guild").send();
                await Promise.all([guilds.updateOne({name: guild.name}, {$set: {name}}),
                members.updateMany({guildName: guild.name}, {$set: {guildName: name}})])
                Embed(msg).setSuccess("Название успешно обновлено.").send();
                break;
            }

            case "limit": {
                if (!params[0]) return methods.createError(msg, "Укажите лимит, если лимит будет больше участников гильдии, то люди не смогут присоединяться,", eg.name).send();
                if (isNaN(+params[0]) || +params[0] <= 0) return methods.createError(msg, `Укажите новый лимит, от 1 до ${(GUILD_MEMBERS_MAX_SIZE || 500)}.`, eg.name).send();
                const limit = +params[0] <= (GUILD_MEMBERS_MAX_SIZE || 500) ? Math.round(+params[0]) : (GUILD_MEMBERS_MAX_SIZE || 500);
                await guilds.updateOne({name: guild.name}, {$set: {limit}});
                Embed(msg).setSuccess("Успешно установлен новый лимит: " + limit).send();
                break;
            }

            case "privacy": {
                const sliders = ["on", "off"];
                if (!params[0] || !sliders.includes(params[0].toLowerCase())) return methods.createError(msg, "Укажите `on` или `off`, чтобы включить/отключить запросы на вступления", eg.name).send();
                const slide = params[0].toLowerCase();

                if (slide === "on") {
                    await guilds.updateOne({name: guild.name}, {$set: {privacy: true}});
                    Embed(msg).setSuccess("Запросы успешно включены.").send();
                } else {
                    await guilds.updateOne({name: guild.name}, {$set: {privacy: false}});
                    Embed(msg).setSuccess("Запросы успешно отключены.").send();
                }
                break;
            }


        }
    }
})