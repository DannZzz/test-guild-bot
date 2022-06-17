import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "master-role",
    aliases: ["master"],
    description: "посмотреть/изменить роли мастеров",
    examples: ["{prefix}master", "{prefix}master @Master-Role"],
    category: 3,
    permissions: "MANAGE_GUILD",
    async run({args, msg, client, methods, prefix, sd}) {
        if (!args[0]) {
            const roles = sd.master.map(s => {
                const role = msg.guild.roles.cache.get(s);
                if (role) return role;
            });
            if (roles.length !== sd.master.length) await servers.updateOne({_id: msg.guildId}, {$set: {master: roles.map(r => r.id)}});
            return Embed(msg).setAuthor({name: `⚙Роли мастеров`}).setText(`\`${prefix}master-role @Role\`\nЕсли роль имеется в списке, она уберётся, а если нет, то добавится.`).addField("Роли", `${roles.length > 0 ? roles.join(", ") : "Нет ролей"}`).send();
        } else {
            const role = msg.mentions.roles.first() || msg.guild.roles.cache.get(args[0]);
            if (!role) return methods.createError(msg, "Роль не найдена!", "master-role").send();
            if (sd.master.includes(role.id)) {
                const newArr = client.util.remove(sd.master, {elements: [role.id], indexes: []});
                await servers.updateOne({_id: msg.guildId}, {$set: {master: newArr}});
                return Embed(msg).setSuccess("Роль успешно убрана!").send();
            } else {
                await servers.updateOne({_id: msg.guildId}, {$push: {master: role.id}});
                return Embed(msg).setSuccess("Роль успешно добавлена!").send();
            }
        }
    }
})