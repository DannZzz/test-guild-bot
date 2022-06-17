import { Message } from "discord.js";
import { findOrCreate, getMemberGuild, givePoints } from "../database/db";
import { Event } from "../structures/Event";
import { Limiter } from "client-discord";
import { XP_ADD_ONE_TIME_IN_MINUTES } from "../config";
import { guilds, GuildSchema } from "../database/models/guildSchema";
const limiting = new Limiter(1, XP_ADD_ONE_TIME_IN_MINUTES.time * 1000);
export default new Event ({
    name: "messageCreate",
    async run({ctx, client}) {
        const message = (ctx[0] as any) as Message;
        const guild = await findOrCreate("servers", message.guild.id);
        if (guild.ignoreChannels.includes(message.channelId)) return;
        if (limiting.take(message.author.id)) return;
        const memberGuild = await getMemberGuild(message.author.id) as GuildSchema;
        if (!memberGuild) return;
        await Promise.all([
            givePoints(message.author.id, XP_ADD_ONE_TIME_IN_MINUTES.add),
        ]);
    }
})