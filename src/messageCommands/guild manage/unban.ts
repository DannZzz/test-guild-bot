import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "unban",
    description: "разбанить пользователя",
    category: 1,
    cooldown: 3,
    examples: ["{prefix}unban @Aeolian#0001", "{prefix}unban 14894114747942"],
    run: async ({client, args, msg, methods, prefix}) => {
        const guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!guild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        if (!hasPermissionsInGuild(guild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();

        if (!args[0]) return methods.createError(msg, "Укажите участника.", "unban").send();
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member && args[0] !== "all") return methods.createError(msg, "Участник не найден.", "unban").send();
        if (args[0] === "all") {
            await guilds.updateOne({name: guild.name}, {$set: {bans: []}});
            return Embed(msg).setSuccess(`Все участники разбанены!`).send();
        }
        const fetch = await fetchGuild(guild.name, {bans: true});

        if (!fetch.bans.includes(member.id)) return Embed(msg).setError("Указанный участник не был забанен.").send();

        const newArr = client.util.remove(fetch.bans, {elements: [member.id], indexes: []});

        await guilds.updateOne({name: guild.name}, {$set: {bans: newArr}});

        Embed(msg).setSuccess("Участник **" + member.user.username + "** успешно разбанен.").send();
    }
})