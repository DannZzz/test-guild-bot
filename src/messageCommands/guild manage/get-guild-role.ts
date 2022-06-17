import { getMemberGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "get-guild-role",
    aliases: ["ggr"],
    description: "получить роль своей гильдии",
    category: 1,
    async run({msg, client, prefix}) {
        const userGuild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!userGuild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        const roles = userGuild.roles.map(s => {
            const role = msg.guild.roles.cache.get(s);
            if (role) return role;
        });
        if (roles.length === 0) return Embed(msg).setError("Ваша гильдия не имеет ролей.").send();
        try {
            await msg.member.roles.add(roles.map(r => r.id));
            return Embed(msg).setSuccess(`Вы успешно получили роли: ${roles.join(", ")}`)
        } catch {
            Embed(msg).setTitle("Что-то пошло не так").setError("Возможно у меня нет прав, или роль находится выше меня.\nОбратитесь к администрации!").send();
        }
    }

})