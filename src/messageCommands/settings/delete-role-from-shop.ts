import { findOrCreate, givePoints } from "../../database/db";
import { Member } from "../../database/models/memberSchema";
import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "delete-role",
    aliases: ["dr"],
    category: 3,
    description: "удалить роль из магазина",
    cooldown: 4,
    master: true,
    examples: ["{prefix}delete-role 4"],
    async run ({msg, sd, args, methods, client}) {
        if (!sd.roleShop || sd.roleShop.length === 0) return methods.createError(msg, "Магазин отстуствует..").send();

        if (!args[0] || isNaN(+args[0])) return methods.createError(msg, "Укажите номер роли из магазина.", "delete-role").send();

        const index = Math.round(+args[0]) - 1;

        const item = sd.roleShop[index];

        if (!item) return methods.createError(msg, `Роль с номеров **${index}** не найдена!`).send();

        const newList = client.util.remove(sd.roleShop, {indexes: [index], elements: []});

        await servers.updateOne({_id: msg.guildId}, {$set: {roleShop: newList}})

        Embed(msg).setSuccess("Роль успешна убрана!").send();
    }
})