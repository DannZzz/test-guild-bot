import { MessageCommand } from "../../structures/MessageCommand";
import validUrl from "valid-url";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";

export default new MessageCommand ({
    name: "set-avatar",
    category: 4,
    description: "установить фото профиля",
    examples: ["{prefix}set-avatar "],
    async run ({msg, args, client, methods, prefix}) {
        if ((!args[0] || !validUrl.isUri(args[0])) && !msg.attachments.first()) return methods.createError(msg, "Прикрепите файл, либо укажите ссылку на фото!", "set-avatar").send();
        const att = msg.attachments.first();
        await members.updateOne({_id: msg.author.id}, {$set: {avatarUrl: validUrl.isUri(args[0]) ? args[0] : (att.url || att.proxyURL)}});
        Embed(msg).setSuccess(`Фото сохранено, покупайте **Буст Профиля** в магазине, чтобы оно показывалось! (\`${prefix}shop\`)`).send();
    }
})