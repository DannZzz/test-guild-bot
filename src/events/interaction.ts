import { GuildMemberRoleManager, Interaction, Message, MessageEmbed } from "discord.js";
import { canJoinGuild, fetchGuild, findOrCreate, JoinGuildErrors } from "../database/db";
import { guilds, GuildSchema } from "../database/models/guildSchema";
import { members } from "../database/models/memberSchema";
import { Event } from "../structures/Event";
import { REQUESTS_COOLDOWN_MINUTES } from "../config";
import { ServerInterface } from "../database/models/serverSchema";

export default new Event ({
    name: "interactionCreate",
    async run({ctx, client}) {
        const interaction = (ctx[0] as any) as Interaction;
        if (interaction.isButton()) {
            if (interaction.customId.startsWith("invite-")) {
                await interaction.deferUpdate();
                const guildName = interaction.customId.substring(7, interaction.customId.length);
                // console.log(guildName);
                const er = await canJoinGuild(interaction.user.id, guildName);
                if (er === true) {
                    await members.updateOne({_id: interaction.user.id}, {$set: {guildName}});
                    return interaction.followUp({content: "Вы успешно вошли в гильдию.", ephemeral: true})
                } else if (er === "privacy") {
                    await Promise.all([
                        guilds.updateOne({name: guildName}, {$push: {requests: interaction.user.id}}),
                        members.updateOne({_id: interaction.user.id}, {$set: {"cooldowns.join": Date.now() + (( REQUESTS_COOLDOWN_MINUTES || 15) * 1000 * 60)}})
                    ]);
                    return interaction.followUp({content: "Ваша заявка отправлена!", ephemeral: true})
                } else {
                    return interaction.followUp({content: JoinGuildErrors[er], ephemeral: true});
                }
            } else if (interaction.customId.startsWith("duel-")) {
                await interaction.deferUpdate();
                const guild = await findOrCreate("servers", interaction.guildId) as ServerInterface;
                if (!interaction.memberPermissions.has("ADMINISTRATOR") && !(interaction.member.roles as GuildMemberRoleManager).cache.hasAny(...(guild.master || []))) return interaction.followUp("У вас недостаточно прав.");
                const customId = interaction.customId;
                if (customId === "duel-declined") {
                    (interaction.message as Message).edit({components: [], embeds: [(interaction.message.embeds[0] as MessageEmbed).addField("Статус", "🔴 Отказано")]});
                } else {
                    const params = customId.split("-"); // ["duel", "winnerId", "loserId", bet]

                    const winner = params[1];
                    const loser = params[2];
                    const bet = +params[3];
                    
                    await Promise.all([
                        (interaction.message as Message).edit({components: [], embeds: [(interaction.message.embeds[0] as MessageEmbed).addField("Статус", "🟢 Подтверждено")]}),
                        members.updateOne({_id: winner}, {$inc: {duelsPlayed: 1, duelsWon: 1, points: bet}}),
                        members.updateOne({_id: loser}, {$inc: {duelsPlayed: 1, points: -bet}})
                    ])
                }
            }
        }
    }
});