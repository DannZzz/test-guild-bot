import { ColorResolvable, Message, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import { Client } from "client-discord";
import { ERROR_EMOJI, SUCCESS_EMOJI } from "../config";

type sendType = "followUp" | "reply" ;

export class EmbedMessage extends MessageEmbed {
    private readonly client: Client;
    private readonly colors: {[key: string]: ColorResolvable};
    constructor(private message: Message) {
        super();
        this.footer = {
            text: `Запросил(-а) ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({dynamic: true})
        }
        this.client = message.guild.me.client as Client;
        this.colors = this.client.colors;
    }

    public setSuccess (text: string) {
        this.setDescription((SUCCESS_EMOJI || "✅") + " " + text).setColor(this.colors.success);
        return this;
    }

    public setError (text: string) {
        this.setDescription((ERROR_EMOJI || "❌") + " " + text).setColor(this.colors.error);
        return this;
    }

    public setText (text: string) {
        this.setDescription(text).setColor(this.colors.main);
        return this;
    }

    /**
     * 
     * @param channel Text Channel or milliseconds (timout ->> delete the msg)
     * @param {MessageOptions} options options to send with embed
     */
     public send(channel?: TextChannel): Promise<Message>;
     public send(channel?: number): Promise<Message>;
     public async send (channel?: number, options?: MessageOptions): Promise<Message>;
     public async send (channel?: TextChannel, options?: MessageOptions): Promise<Message>;
     public async send (channel?: TextChannel | number, options?: MessageOptions): Promise<Message> {
         if (!channel) {
             if (!options) {
                 return this.message.channel.send({embeds: [this]})
             } else {
                 if (!options.embeds) options.embeds = [];
                 options.embeds.unshift(this)
                 return this.message.channel.send(options)
             }
         } else {
             if (typeof channel === "number") {
                 if (!options) {
                     const msg = await this.message.channel.send({embeds: [this]});
                     setTimeout(() => msg.delete(), channel);
                     return msg;
                 } else {
                     if (!options.embeds) options.embeds = [];
                     options.embeds.unshift(this)
                     const msg = await this.message.channel.send(options);
                     setTimeout(() => msg.delete(), channel);
                     return msg;
                 }
             } else {
                 if (!options) {
                     return channel.send({embeds: [this]})
                 } else {
                     if (!options.embeds) options.embeds = [];
                     options.embeds.unshift(this)
                     return channel.send(options);
                 }
             }
         }
     }
    
}

export const Embed = function(message: Message) {
    return new EmbedMessage(message);
}