import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "set-status",
    permissions: "ADMINISTRATOR",
    category: 3,
    cooldown: 5,
    description: "поставить новый статус бота",
    examples: ["{prefix}set-status !help for commands list"],
    async run ({client, msg, args, methods}) {
        if (!args[0]) return methods.createError(msg, "Укажите статус!", "set-status").send();

        const status = args.join(" ");
        client.user.setActivity({name: client.util.shorten(status, 127), type: "STREAMING"})
        Embed(msg).setSuccess("Новый статус установлен!").send();
    }
})