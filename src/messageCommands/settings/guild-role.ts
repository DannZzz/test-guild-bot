import { fetchGuild } from "../../database/db";
import { guilds } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "guild-role",
    description: "изменять роли гильдии",
    master: true,
    aliases: ["gr"],
    category: 3,
    examples: ["{prefix}guild-role @НаВысоте Топы", `{prefix}gr 49847941747949749 Топы`],
    async run ({msg, args, client, methods, prefix}) {
        if (!args[0]) return methods.createError(msg, "Укажите роль", "guild-role").send();

        
            if (!args[1]) return methods.createError(msg, "Укажите название гильдии.", "guild-role").send();
            const role = msg.mentions.roles.first() || msg.guild.roles.cache.get(args[0]);
            if (!role) return methods.createError(msg, "Укажите роль.", "guild-role").send();
            const name = args.slice(1).join(" ");
            const fetch = await fetchGuild(name);
            if (!fetch.Guild) return Embed(msg).setError("Гильдия не найдена!").send();
            const roles = (fetch.Guild.roles || []).filter(s => msg.guild.roles.cache.has(s));
            if (roles.includes(role.id)) {
                const newArr = client.util.remove(roles, {elements: [role.id], indexes: []});
                await guilds.updateOne({name}, {$set: {roles: newArr}});
                return Embed(msg).setSuccess(`Роль **${role.name}** успешно убрана.`).send();
            } else {
                if (role.position >= msg.member.roles.highest.position) return Embed(msg).setError("Вы не сможете назначить эту роль для гильдий, она выше вас.").send();
                if (role.position >= msg.guild.me.roles.highest.position) return Embed(msg).setError("Эта роль выше меня!").send();
                await guilds.updateOne({name}, {$push: {roles: role.id}});
                return Embed(msg).setSuccess(`Роль **${role.name}** успешно добавлена.`).send();                
            }
           
        
    }
})