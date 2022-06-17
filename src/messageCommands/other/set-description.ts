import { MessageCommand } from "../../structures/MessageCommand";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";

export default new MessageCommand ({
    name: "set-description",
    category: 4,
    description: "установить описание профиля",
    examples: ["{prefix}set-description Мой ник в игре: Dann441"],
    async run ({msg, args, client, methods, prefix}) {
        if (!args[0]) return methods.createError(msg, "Укажите описание.", "set-description").send();
        const description = args.join(" ");
        await members.updateOne({_id: msg.author.id}, {$set: {description}});
        Embed(msg).setSuccess(`Описание успешно сохранено!`).send();
    }
})