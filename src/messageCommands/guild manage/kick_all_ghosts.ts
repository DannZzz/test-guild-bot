import { fetchGuild, getMemberGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand({
    name: "kick-all-ghosts",
    aliases: ["kag"],
    description: "выгнать всех, кто вышел из сервера",
    category: 1,
    cooldown: 3,
    run:async ({msg, prefix}) => {
        const guild = await getMemberGuild(msg.author.id) as GuildSchema;

        if (!guild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        if (guild.leader !== msg.author.id) return Embed(msg).setError("У вас недостаточно прав.").send();

        const fetch = await fetchGuild(guild.name, {members: true});

        const filtered = fetch.members.filter(obj => msg.guild.members.cache.has(obj._id));

        await members.updateMany({_id: {$in: filtered.map(o => o._id)}}, {$set: {guildName: undefined}});

        Embed(msg).setSuccess("Призраки успешно очищены.").send();
    }
})