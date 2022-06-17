import { Formatters } from "discord.js";
import { BOX_EMOJI, CURRENCY, DEFAULT_BOOST_AMOUNT, GUILD_EMOJI, LEVEL_EMOJI, MAX_LENGTH_USER_DESCRIPTION } from "../../config";
import { findOrCreate, getCurrentLevelByXp, getMemberGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { Member } from "../../database/models/memberSchema";
import { DateTime } from "../../structures/DateAndTime";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "user-guild",
    aliases: ["user", 'ug'],
    category: 2,
    description: "статистика участника",
    examples: ["{prefix}user-guild @Aeolian#0001"],
    async run({args, msg, client, methods}) {
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]) || msg.member;
        const memberGuild = await getMemberGuild(member.id) as GuildSchema;
        const memberData = await findOrCreate({name: "members", onlyCheck: true}, member.id) as Member;

        const lvls = getCurrentLevelByXp(memberData.points);
        
        

        let boostTo: Date;
        let defaultBoost: number = DEFAULT_BOOST_AMOUNT;
        let letAvatar = false;
        if (memberData.boost) {
            if (memberData.boost) {
                if (memberData.boost.until && memberData.boost.until > new Date()) {
                    if (memberData.boost.addX) {
                        letAvatar = true;
                        defaultBoost += memberData.boost.addX;
                        boostTo = memberData.boost.until;
                    } 
                }
            }
        }

        // if (memberData.guildName) defaultBoost += 0.2;

        const emb = Embed(msg)
            .setColor(client.colors.main || "RANDOM")
            .setAuthor({name: member.user.tag, iconURL: member.displayAvatarURL({dynamic: true})})
            .addField("📅 Дата регистрации", "> " + Formatters.time(member.user.createdAt, "D"))
            .addField(`🔥 Буст Профиля - ${boostTo ? "Активен" : "Неактивен"}`, "> " + (boostTo ? `Прирост опыта: \`x${defaultBoost.toFixed(1)}\` до ${Formatters.time(boostTo, "f")}` : `\`Прирост опыта: x${defaultBoost.toFixed(1)}\``))
            .addField(`${GUILD_EMOJI} Гильдия`, "> " + (memberGuild ? memberGuild.name : "Не состоит в гильдии"))
            .addField(`${LEVEL_EMOJI} Уровень`, "> " + lvls.current + "")
            .addField(`${CURRENCY.main} Опыт`, "> " + client.util.formatNumber(Math.round(memberData.points)))
            .addField("🎙 Голосовая активность", `> ${DateTime.toStringWithZero(memberData.voice || 0)}`)
            .addField(`${BOX_EMOJI} Боксы`, `> ${client.util.formatNumber(memberData.box || 0)}`)
            .addField(`⚔ Сыграно дуэлей: ${client.util.formatNumber(memberData.duelsPlayed || 0)}`, `> Выиграно дуэлей: ${memberData.duelsWon || 0} (wr. ${( ((memberData.duelsWon || 0) / (memberData.duelsPlayed || 0) || 0) * 100 ).toFixed(1)}%)`)

        if (memberData.description) emb.setText(client.util.shorten(memberData.description, MAX_LENGTH_USER_DESCRIPTION));
        if (letAvatar && memberData.avatarUrl) emb.setImage(memberData.avatarUrl);
        
        emb.send();
    }
})