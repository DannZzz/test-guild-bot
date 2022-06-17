import { servers } from "../../database/models/serverSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "ignore-channel",
    aliases: ["ic"],
    category: 3,
    master: true,
    description: "изменить список игнорируемых каналов от добавлений очков",
    examples: ["{prefix}ic #флуд", '{prefix}ic 21987497841497'],
    async run ({args, msg, client, methods, sd, prefix}) {
        if (!args[0]) {
            const channels = sd.ignoreChannels.map(s => {
                const channel = msg.guild.channels.cache.get(s);
                if (channel) return channel;
            });
            if (channels.length !== sd.ignoreChannels.length) await servers.updateOne({_id: msg.guildId}, {$set: {ignoreChannels: channels}});
            return Embed(msg).setAuthor({name: `⚙Игнорируемые каналы`}).setText(`\`${prefix}ignore-channel #флуд\`\nЕсли канал имеется в списке, он уберётся, а если нет, то добавится.`).addField("Каналы", channels.length > 0 ? channels.map(c => c.name).join(", ") : "Нет каналов").send();
        } else {
            const channel = msg.mentions.channels.first() || msg.guild.channels.cache.get(args[0]);
            if (!channel) return methods.createError(msg, "Канал не найден.", "ignore-channel").send();
            if (channel.type === "GUILD_CATEGORY" || channel.type === "DM") return Embed(msg).setError("Этот канал недоступен!").send();
            if (sd.ignoreChannels.includes(channel.id)) {
                const newArr = client.util.remove(sd.ignoreChannels, {elements: [channel.id], indexes: []});
                await servers.updateOne({_id: msg.guildId}, {$set: {ignoreChannels: newArr}});
                return Embed(msg).setSuccess("Канал успешно убран.").send();
            } else {
                await servers.updateOne({_id: msg.guildId}, {$push: {ignoreChannels: channel.id}});
                return Embed(msg).setSuccess("Канал усшено добавлен.").send();
            }
        }
        
    }
})