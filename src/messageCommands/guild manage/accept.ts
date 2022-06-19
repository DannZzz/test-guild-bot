import { MessageEmbed } from "discord.js";
import { ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING, COLORS, GUILD_MEMBERS_MAX_SIZE } from "../../config";
import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "accept",
    aliases: ["ac"],
    description: "принять заявку",
    category: 1,
    examples: ["{prefix}accept 4"],
    cooldown: 3,
    run:async ({args, msg, methods, prefix, client}) => {
        const userGuild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!userGuild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        const fetch = await fetchGuild(userGuild.name, {helpers: true, members: true, bans: true});
    
        if (!hasPermissionsInGuild(userGuild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();
        if (fetch.Guild?.limit <= fetch.members.length) return Embed(msg).setError("Превышен лимит!").send();
        if (fetch.members.length >= (GUILD_MEMBERS_MAX_SIZE || 500)) return Embed(msg).setError(`На вашей гильдии больше не осталось мест.`).send();
            
        if (!args[0] || isNaN(+args[0])) return methods.createError(msg, "Укажите номер заявки.", "accept").send();
        const index = Math.round(+args[0]) - 1;
        
        const requests = userGuild.requests || [];

        if (!requests[index]) return Embed(msg).setError("Заявка с этим номером не найдена.").send();
        if (fetch.bans.includes(requests[index])) return Embed(msg).setError("Этот участник забанен.").send();
        
        const thisMemberGuild = await getMemberGuild(requests[index], true);
        if (thisMemberGuild) {
            const newReq = requests.filter(id => id !== requests[index]);
            await guilds.updateOne({name: userGuild.name}, {$set: {requests: newReq}});
            return Embed(msg).setError("Этот участник в настоящее время находится в другой гильдии.").send();
        }
        
        const newRequests = client.util.remove(requests, {indexes: [index], elements: []});
        const member = msg.guild.members.cache.get(requests[index]);

        await Promise.all([
            guilds.updateOne({name: userGuild.name}, {$set: {requests: newRequests}}),
            members.updateOne({_id: requests[index]}, {$set: {guildName: userGuild.name}})
        ])

        if (ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING) {
            const roles = fetch.Guild.roles.filter(s => msg.guild.roles.cache.has(s));
            try {
                member && msg.member.roles.add(roles);
            } catch {}
        }
        
        try {
            member && await member.user.send({embeds: [new MessageEmbed().setColor(COLORS.success).setDescription(`Вас приняли в гильдию **${fetch.Guild.name}**.`).setTitle(`⚔ | Добро пожаловать`)]})
        } catch {}
        
        Embed(msg).setSuccess("Заявка успешно принята.").send();
    }
})