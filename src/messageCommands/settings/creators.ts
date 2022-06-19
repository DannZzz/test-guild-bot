import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "creator-role",
    aliases: ["cr"],
    description: "посмотреть/изменить роли создателей гильдии",
    examples: ["{prefix}creator-role", "{prefix}creator-role @Creator"],
    category: 3,
    permissions: "MANAGE_GUILD",
    async run({args, msg, client, methods, prefix, sd}) {
        if (!args[0]) {
            const roles = sd.creator_roles.map(s => {
                const role = msg.guild.roles.cache.get(s);
                if (role) return role;
            });
            if (roles.length !== sd.creator_roles.length) await servers.updateOne({_id: msg.guildId}, {$set: {creator_roles: roles.map(r => r.id)}});
            return Embed(msg).setAuthor({name: `⚙Роли создателей`}).setText(`\`${prefix}creator-role @Role\`\nЕсли роль имеется в списке, она уберётся, а если нет, то добавится.`).addField("Роли", `${roles.length > 0 ? roles.join(", ") : "Нет ролей"}`).send();
        } else {
            const role = msg.mentions.roles.first() || msg.guild.roles.cache.get(args[0]);
            if (!role) return methods.createError(msg, "Роль не найдена!", "creator-role").send();
            if (sd.creator_roles.includes(role.id)) {
                const newArr = client.util.remove(sd.creator_roles, {elements: [role.id], indexes: []});
                await servers.updateOne({_id: msg.guildId}, {$set: {creator_roles: newArr}});
                return Embed(msg).setSuccess("Роль успешно убрана!").send();
            } else {
                await servers.updateOne({_id: msg.guildId}, {$push: {creator_roles: role.id}});
                return Embed(msg).setSuccess("Роль успешно добавлена!").send();
            }
        }
    }
})