import { ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING, REQUESTS_COOLDOWN_MINUTES } from "../../config";
import { canJoinGuild, fetchGuild, JoinGuildErrors } from "../../database/db";
import { guilds } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "join-guild",
    aliases: ["jg", "join"],
    description: "войти в гильдию",
    category: 2,
    examples: ["{prefix}join-guild Звезда"],
    cooldown: 3,
    async run ({client, msg, args, prefix, methods}) {
        if (!args[0]) return methods.createError(msg, "Укажите название гильдии.", "join-guild").send();
        const name = args.join(" ");
        const ifcan = await canJoinGuild(msg.author.id, name);
        if (ifcan === true) {
            await members.updateOne({_id: msg.author.id}, {$set: {guildName: name}});
            Embed(msg).setSuccess("Вы успешно вошли в гильдию.").send();
            if (ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING) {
                const fetch = await fetchGuild(name);
                const roles = fetch.Guild.roles.filter(s => msg.guild.roles.cache.has(s));
                msg.member.roles.add(roles);
            }
            return;
        } else if (ifcan === "privacy") {
            await Promise.all([
                guilds.updateOne({name}, {$push: {requests: msg.author.id}}),
                members.updateOne({_id: msg.author.id}, {$set: {"cooldowns.join": Date.now() + (( REQUESTS_COOLDOWN_MINUTES || 15) * 1000 * 60)}})
            ]);
            return Embed(msg).setSuccess("Ваша заявка отправлена!").send();
        } else {
            return Embed(msg).setError(JoinGuildErrors[ifcan]).send();
        }
    }
})

