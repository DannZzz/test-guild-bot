import { findOrCreate } from "../../database/db";
import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "prefix",
    aliases: ["pr"],
    category: 3,
    examples: ["{prefix}prefix !", "{prefix}pr .."],
    permissions: "MANAGE_GUILD",
    description: "установить новый префикс",
    run: async ({client, args, msg, prefix, methods}): Promise<any> => {
        if (!args[0]) return methods.createError(msg, "Укажите новый префикс.", "prefix").send();
        const guild = await findOrCreate("servers", msg.guildId);

        guild.prefix = args[0];
        guild.save();
        Embed(msg).setSuccess("Новый префикс успешно установлен.").send();
    }
})