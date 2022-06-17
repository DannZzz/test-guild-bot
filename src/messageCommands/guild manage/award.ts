import { AWARDS_MAX_LENGTH } from "../../config";
import { fetchGuild } from "../../database/db";
import { guilds } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "award",
    aliases: ["aw"],
    description: "изменить награды гильдии",
    category: 1,
    cooldown: 3,
    master: true,
    params: ["add", "remove"],
    examples: ["{prefix}award add [Самые Сильные] 🥇", "{prefix}aw remove Топы 🥉"],
    run:async ({client, args, msg, methods, prefix, sd}) => {
        const cmd = methods.getCommand("award");

        function getGuildName (text: string): string {
            const isThereScop = text.split('[', 1).join("");
            if (isThereScop.length === text.length) return text.split(" ")[0];
            const lastScop = isThereScop.split("]", 1);
            return lastScop[0]
        }
        if (!msg.member.roles.cache.hasAny(...(sd.master || [])) && !msg.member.permissions.has("ADMINISTRATOR")) return methods.createError(msg, "У вас недостаточно прав!").send();
        if (!args[0]) return methods.createError(msg, "Укажите параметр.", cmd.name).send();
        const param = args[0].toLowerCase();
        if (!cmd.params.includes(param)) return methods.createError(msg, "Вы указали неверный параметр.", cmd.name).send();

        const withoutParam = args.slice(1);

        const guildName = getGuildName(withoutParam.join(" "));
        if (!withoutParam || withoutParam.length === 0) return methods.createError(msg, "Укажите награду.", cmd.name).send();
        const fetch = await fetchGuild(guildName);

        if (!fetch.Guild) return Embed(msg).setError(`Гильдия под названием **${guildName}** не найдена.`).send();
        const award = withoutParam.join(" ").slice(guildName.length).replaceAll("[", " ").replaceAll("]", " ").trim().split(/ /g).join(" ");
        if (award.length > (AWARDS_MAX_LENGTH || 40)) return Embed(msg).setError("Награда слишком длинная.").send();
        if (param === "add") {
            await guilds.updateOne({name: guildName}, {$push: {awards: award}});
            Embed(msg).setSuccess("Награда успешно добавлена.").send();
        } else if (param === "remove" || param === "r") {
            const indexOfAwardInAwards = fetch.Guild.awards.indexOf(award);

            if (indexOfAwardInAwards === -1) return Embed(msg).setError("Награда не найдена.").send();

            const newAwards = client.util.remove(fetch.Guild.awards, {indexes: [indexOfAwardInAwards], elements: []});
            await guilds.updateOne({name: guildName}, {$set: {awards: newAwards}});
            Embed(msg).setSuccess("Награда успешно убрана.").send();
        }
    }
})