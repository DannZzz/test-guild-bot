import { fetchGuild, findOrCreate, givePoints } from "../../database/db";
import { guilds } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "xp",
    master: true,
    category: 1,
    description: "добавить очки участнику",
    examples: ["{prefix}xp @Dann#2523 -500", "{prefix}xp 489491741457494 7491"],
    async run ({args, msg, methods, prefix, client, sd}) {
        if (!args[0]) return methods.createError(msg, "Укажите участника.", 'xp').send();
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return Embed(msg).setError("Участник не найден!").send();
        
        if (!args[1] || isNaN(+args[1])) return methods.createError(msg, "Укажите количество очков.", "xp").send();
        const points = Math.round(+args[1]);
        
        await givePoints(member.id, points, true);
        
        Embed(msg).setSuccess("Очки успешно добавлены!").send();
    }
})