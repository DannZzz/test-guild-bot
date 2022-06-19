import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { guilds, GuildSchema } from "../../database/models/guildSchema";
import { members } from "../../database/models/memberSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "decline",
    aliases: ['dec', 'reject'],
    description: "отклонить заявку",
    category: 1,
    examples: ["{prefix}decline 4"],
    cooldown: 3,
    run: async ({methods, args, client, msg, prefix}) => {
        const userGuild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!userGuild) return Embed(msg).setError(`Вы не состоите в гильдии.\nВступить в гильдию: \`${prefix}join-guild <название гильдии>\`\nПопробуйте выбрать одну: \`${prefix}top\``).send();
        const fetch = await fetchGuild(userGuild.name, {helpers: true, members: true});
    
        if (!hasPermissionsInGuild(userGuild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();

        if (!args[0] || isNaN(+args[0])) return methods.createError(msg, "Укажите номер заявки.", "decline").send();
        const index = Math.round(+args[0]) - 1;
        
        const requests = userGuild.requests || [];

        if (!requests[index]) return Embed(msg).setError("Заявка с этим номером не найдена.").send();

        const newRequests = client.util.remove(requests, {indexes: [index], elements: []});

        await guilds.updateOne({name: userGuild.name}, {$set: {requests: newRequests}});
        
        Embed(msg).setSuccess("Заявка успешно отклонена.").send();
    }
})