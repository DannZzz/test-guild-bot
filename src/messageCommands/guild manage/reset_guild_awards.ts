import { fetchGuild } from "../../database/db";
import { guilds } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "reset-guild-awards",
    aliases: ["rga"],
    description: "очистить награды гильдии",
    cooldown: 3,
    category: 1,
    master: true,
    examples: ["{prefix}rga Топы"],
    run:async ({client, args, msg, methods}) => {
        if (!args[0]) return methods.createError(msg, "Укажите название гильдии.", "rga").send();

        const guildName = args.join(" ");

        const fetch = await fetchGuild(guildName);
        if (!fetch) return Embed(msg).setError("Гильдия не найдена.").send();

        await guilds.updateOne({name: guildName}, {$set: {awards: []}});

        Embed(msg).setSuccess("Награды успешно сброшены.").send();        
    }
})