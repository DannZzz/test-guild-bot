import { fetchGuild, getMemberGuild } from "../../database/db";
import { guilds, uuid } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "admin-create-guild",
    aliases: ["acg"],
    master: true,
    category: 3,
    examples: ["{prefix}admin-create-guild @Dann#2523 Индонезия"],
    description: "создать гильдию и назначить владельца",
    async run ({msg, args, client, methods}) {
        if (!args[0]) return methods.createError(msg, "Укажите владельца!", "admin-create-guild").send();
        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return methods.createError(msg, "Участник не найден!").send();
        const memberGuild = await getMemberGuild(member.id, true) as boolean;
        if (memberGuild) return methods.createError(msg, "Этот участник уже находится в гильдии.").send();

        if (!args[1]) return methods.createError(msg, "Укажите название гильдии.", "admin-create-guild").send();

        const name = args.slice(1).join(" ");
        const fetch = await fetchGuild(name);
        if (fetch.Guild) return methods.createError(msg, "Гильдия с этим названием уже существует!").send();

        const newGuild = await guilds.create({
            id: uuid(null, 50),
            name,
            leader: member.id
        })
        newGuild.save()

        await members.updateOne({_id: member.id}, {$set: {guildName: name}})
        
        Embed(msg).setSuccess("Новая гильдия успешно создана!").send();
    }
})