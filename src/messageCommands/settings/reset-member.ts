import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "reset-member",
    description: "сбрасывать статистику участника",
    cooldown: 2,
    master: true,
    category: 3,
    examples: ["{prefix}reset-member @Dann#2523", "{prefix}reset-member all"],
    async run ({msg, methods, args}) {
        if (!args[0]) return methods.createError(msg, `Укажите участника, либо \`all\`, чтобы сбрасывать участников.`, 'reset-member').send();

        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);

        if (!member && args[0].toLowerCase() !== "all") return methods.createError(msg, `Укажите участника, либо \`all\`, чтобы сбрасывать участников.`, 'reset-member').send();

        if (member) {
            await members.updateOne({_id: member.id}, {$unset: {avatarUrl: '', description: '', points: '', voice: '', box: '', duelsPlayed: '', duelsWon: '', cooldowns: '', boost: ''}});
            Embed(msg)
                .setSuccess(`Успешно сброшена статистика ${member.user.username}.`)
                .send();
        } else {
            await members.updateMany({}, {$unset: {avatarUrl: '', description: '', points: '', voice: '', box: '', duelsPlayed: '', duelsWon: '', cooldowns: '', boost: ''}});
            Embed(msg)
                .setSuccess(`Успешно сброшена статистика всех участников.`)
                .send();
        }
    }
})