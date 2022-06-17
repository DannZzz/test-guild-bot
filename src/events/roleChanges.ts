import { GuildMember, MessageEmbed, PartialGuildMember } from "discord.js";
import { ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING, COLORS, ERROR_EMOJI, REQUESTS_COOLDOWN_MINUTES } from "../config";
import { canJoinGuild, fetchGuild, findOrCreate, JoinGuildErrors } from "../database/db";
import { guilds, GuildSchema } from "../database/models/guildSchema";
import { Member, members } from "../database/models/memberSchema";
import { ServerInterface } from "../database/models/serverSchema";
import { Embed } from "../structures/Embed";
import { Event } from "../structures/Event";

export default new Event({
    name: "guildMemberUpdate",
    async run({ client, ctx }) {
        const oldMember = (ctx[0] as any) as GuildMember;
        const newMember = (ctx[1] as any) as GuildMember;
        if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            // console.log("really changed")
            const Guilds_with_roles_specified = await guilds.find({ guildRole: { $exists: true } }) as GuildSchema[];
            if (!Guilds_with_roles_specified || Guilds_with_roles_specified.length === 0) return;

            const addedRoles = newMember.roles.cache.difference(oldMember.roles.cache);

            addedRoles.forEach(r => {
                if (!Guilds_with_roles_specified.find(x => x.guildRole === r.id)) addedRoles.delete(r.id);
            })

            if (addedRoles.size === 0) return;
            // console.log("roles exist", addedRoles);

            const sel = addedRoles.first();
            const id = oldMember.id;
            const guildWithThisRole = Guilds_with_roles_specified.find(x => x.guildRole === sel.id);
            const name = guildWithThisRole.name;
            const member = await findOrCreate('members', oldMember.id) as Member;
            if (!member.guildName) {

                const ifcan = await canJoinGuild(id, name);
                if (ifcan === true) {
                    await members.updateOne({_id: id}, {$set: {guildName: name}});
                    try {
                        await newMember.user.send({embeds: [new MessageEmbed().setColor(COLORS.success).setDescription(`Теперь Вы участник **${name}**, т.к. получили роль **${sel.name}**.`).setTitle(`⚔ | Добро пожаловать`)]})
                    } catch (e) {
                        console.log(e)
                    }
                    if (ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING) {
                        const roles = guildWithThisRole.roles.filter(s => newMember.guild.roles.cache.has(s));
                        newMember.roles.add(roles);
                    }
                    return;
                } else if (ifcan === "privacy") {
                    await Promise.all([
                        guilds.updateOne({name}, {$push: {requests: id}}),
                        members.updateOne({_id: id}, {$set: {"cooldowns.join": Date.now() + (( REQUESTS_COOLDOWN_MINUTES || 15) * 1000 * 60)}})
                    ]);
                    return newMember.user.send({embeds: [new MessageEmbed().setColor(COLORS.main).setDescription(`Вы отправили заявку на вступление в гильдию **${name}**.`).setTitle(`⌛ | Ожидание`)]})
                } else {
                    return newMember.user.send({embeds: [new MessageEmbed().setColor(COLORS.error).setDescription(JoinGuildErrors[ifcan]).setTitle(`${ERROR_EMOJI} | Ошибка`)]})
                }
                
                
            }


        } else if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            const member = await findOrCreate('members', oldMember.id) as Member;
            const guild = await findOrCreate('servers', oldMember.guild.id) as ServerInterface;
            if (!member.guildName) return;
            const fetch = await fetchGuild(member.guildName, {helpers: true});
            if (fetch.Guild.leader === oldMember.id) return;
            const removedRoles = oldMember.roles.cache.difference(newMember.roles.cache);
            const sel = removedRoles.first();
            if (!sel) return;
            if (fetch.Guild.guildRole !== sel.id) return;
            if (fetch.helpers.map(x => x._id).includes(newMember.id)) {
                return newMember.user.send({embeds: [new MessageEmbed().setColor(COLORS.error).setDescription(`Вы потеряли роль **${sel.name}**, но вы помощник гильдии.\n\nЕсли вы хотите выйти, напишите команду: \`${guild.prefix}leave-guild\``).setTitle(`${ERROR_EMOJI} | Ошибка`)]})
            }
            await members.updateOne({_id: oldMember.id}, {$unset: {guildName: ""}});
            try {
                await newMember.user.send({embeds: [new MessageEmbed().setColor(COLORS.error).setDescription(`Вы были исключены из **${fetch.Guild.name}**, так как потеряли роль **${sel.name}**.`).setTitle(`🚪 | Автоматический кик`)]})
            } catch {}
        
            try {
                const roles = fetch.Guild.roles.filter(s => newMember.guild.roles.cache.has(s));
                newMember.roles.remove(roles);
            } catch {}
        }
    }
})