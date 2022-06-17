import { UserResolvable, VoiceState } from "discord.js";
import { findOrCreate } from "../database/db";
import { members } from "../database/models/memberSchema";
import { ServerInterface } from "../database/models/serverSchema";
import { DateTime } from "../structures/DateAndTime";
import { Event } from "../structures/Event";
const timers = new Map<UserResolvable, Date>();

export default new Event({
    name: "voiceStateUpdate",
    async run({ client, ctx }) {
        const oldState = (ctx[0] as any) as VoiceState;
        const newState = (ctx[1] as any) as VoiceState;

        const server = await findOrCreate("servers", newState.guild.id) as ServerInterface;

        if (server.ignoreChannels.some( id => [newState.channelId, oldState.channelId].includes(id))) return;
        
        const newMember = newState.member
        const oldMember = oldState.member;
        // console.log(newMember, oldMember)
        if (oldMember.user.bot || newMember.user.bot) return;
        if (newState.channel) {

            const ended = timers.get(newMember.id);
            if (ended) {

                const timeData = DateTime.getTimeData(Date.now(), ended.getTime());

                await members.updateOne({ _id: newMember.id }, {
                    $inc: {
                        voice: Date.now() - ended.getTime()
                    }
                });
            }

            timers.set(newMember.id, new Date());
            await findOrCreate("members", newMember.id);
            //const data = await findOrCreate(newState.member.id);
        } else if (oldState.channel) {

            const ended = timers.get(oldMember.id);
            if (!ended) return;
            timers.delete(oldMember.id);
            const timeData = DateTime.getTimeData(Date.now(), ended.getTime());

            await members.updateOne({ _id: newMember.id }, {
                $inc: {
                    voice: Date.now() - ended.getTime()
                }
            });
        }

        return;
    }
})