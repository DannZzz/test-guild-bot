import { BOX_EMOJI } from "../../config";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "add-box",
    master: true,
    category: 3,
    description: "выдать боксов",
    examples: ["{prefix}add-box @Dann#2523 5"],
    async run ({client, methods, msg, args}) {
        if (!args[0]) return methods.createError(msg, "Укажите участника.", 'add-box').send();
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return methods.createError(msg, "Участник не найден!").send();
        
        if (!args[1] || isNaN(+args[1])) return methods.createError(msg, "Укажите количество боксов.", "add-box").send();
        const boxes = Math.round(+args[1]);

        await members.updateOne({_id: member.id}, {$inc: {box: boxes}});
        Embed(msg).setSuccess(`Успешно добавлено ${BOX_EMOJI} ${client.util.formatNumber(boxes)} участнику ${member}.`).send();
    }
})