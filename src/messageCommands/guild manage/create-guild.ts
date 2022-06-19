import { GUILD_CREATION_MAX_LIMIT, GUILD_NAME_MAX_LENGTH } from "../../config";
import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, uuid } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "create-guild",
    description: "создать гильдию",
    aliases: ["cg"],
    examples: ["{prefix}create-guild Звёзды", "{prefix}cg Лучшие"],
    category: 1,
    run:async ({client, methods, args, msg, sd}) => {
        const user = msg.author;

        const allGuilds = await guilds.find();
        
        if ((GUILD_CREATION_MAX_LIMIT || 200) <= allGuilds.length) return Embed(msg).setError("В настоящее время невозможно создать новую гильдию, превышен лимит.").send();
        
        if (sd?.creator_roles.length > 0) {
            const filtered = msg.guild.roles.cache.filter(role => sd.creator_roles.includes(role.id)).map(r => r.id);
            if (filtered.length !== sd.creator_roles.length) await servers.updateOne({_id: msg.guildId}, {$set: {creator_roles: filtered}});
            if (filtered?.length > 0 && !msg.member.roles.cache.hasAny(...filtered)) return Embed(msg).setError("У тебя должна быть хотя одна роль создателей гильдий.").send();
        }
        
        if (await getMemberGuild(user.id, true)) return Embed(msg).setError("Вы уже состоите в гильдии, сначала выйдите с помощью команды `leave`").send();
        if (!args[0]) return methods.createError(msg, "Укажите название гильдии", "create-guild").send();

        const name = args.join(" ");
        if (name.length > (GUILD_NAME_MAX_LENGTH || 25)) return methods.createError(msg, `Максимальная длина для названий гильдий - ${GUILD_NAME_MAX_LENGTH || 25} символов.`, "create-guild").send();
        if ((await fetchGuild(name)).Guild) return methods.createError(msg, "Гильдия с этим названием уже существует.").send(); 
        // await guilds.deleteMany()
        const newGuild = await guilds.create({
            id: uuid(null, 50),
            name,
            leader: user.id
        })
        newGuild.save()

        await members.updateOne({_id: user.id}, {$set: {guildName: name}})
        
        Embed(msg).setSuccess("Вы успешно создали новую гильдию!").send();
        
    }
})