import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "add-role",
    aliases: ["ar"],
    description: "добавить роль в магазин",
    cooldown: 2,
    category: 3,
    master: true,
    examples: ["{prefix}add-role @Простенький 8000", "{prefix}ar 4894997419494791 750"],
    async run ({msg, client, args, prefix, sd, methods}) {
        if (!args[0]) return methods.createError(msg, "Укажите роль.", "add-role").send();

        const role = msg.mentions.roles.first() || msg.guild.roles.cache.get(args[0]);
        if (!role) return methods.createError(msg, "Роль не найдена!").send();

        var existsIndex = -1;
        
        if (sd.roleShop) {
            existsIndex = sd.roleShop.findIndex(x => x.roleId === role.id);
        }
        
        if (!args[1] || isNaN(+args[1]) || Math.round(+args[1]) < 1) return methods.createError(msg, "Укажите цену.", "add-role").send();

        const cost = Math.round(+args[1]);

        if (existsIndex !== -1) {
            await servers.updateOne({_id: msg.guildId}, {$set: {[`roleShop.${existsIndex}.cost`]: cost}});
            Embed(msg).setSuccess("Цена роли успешно изменено!").send();
        } else {
            await servers.updateOne({_id: msg.guildId}, {$push: {roleShop: {roleId: role.id, cost} }});
            Embed(msg).setSuccess("Успешно добавлена новая роль в магазин!").send();
        }
        
    }
})