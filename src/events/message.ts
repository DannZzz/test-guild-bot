import { Message, MessageEmbed, TextChannel, Collection } from "discord.js";
import { Client } from "client-discord";
import { findOrCreate } from "../database/db";
import { ServerInterface, servers } from "../database/models/serverSchema";
import { Event } from "../structures/Event";
import { MessageCommandOptions } from "../typings/interfaces";
import { Embed, EmbedMessage } from "../structures/Embed";
import { MessageCommand } from "../structures/MessageCommand";
import { ERROR_EMOJI } from "../config";
var prefix: string = "!";
var sd: ServerInterface;
const cooldowns = new Map();

export default new Event ({
    name: "messageCreate",
    run: async ({client, ctx}) => {
        const message = (ctx[0] as any) as Message;
        if (message?.content?.length > 1) {
            if (client.checkMongoUri() && message.guild) {
                const server = await findOrCreate("servers", message.guild.id);
                prefix = server.prefix || prefix;
                sd = server;
            } else {
                throw new Error("U need to connect mongo db");
            }
            const args = message.content.slice(prefix.length).trim().split(/ +/g);
            var cmd = args.shift();
            cmd = cmd.toLowerCase();
            var methods = new Methods(prefix, client);
            const thisChannel = message.channel as TextChannel;
            if (!message.content.startsWith(prefix) || message.author.bot) return;
            const commandfile: MessageCommandOptions =  client.messageCommands.get(cmd) || client.messageCommands.get(client.messageCommandAliases.get(cmd));
            if (commandfile && !commandfile.disabled) {
                if (thisChannel.type !== "GUILD_TEXT" && ( commandfile.onlyGuild === true || (Array.isArray(commandfile.onlyGuild) && commandfile.onlyGuild.length > 0) )) return;
                if (message.guild && Array.isArray(commandfile.onlyGuild) && !commandfile.onlyGuild.includes(message.guild.id)) return;
                if (!message.member.permissions.has(commandfile.permissions || [])) return Embed(message).setError("У вас недостаточно прав.").send();

                if (commandfile.master && !message.member.roles.cache.hasAny(...(sd.master as string[])) && !message.member.permissions.has("ADMINISTRATOR")) return Embed(message).setError("У вас недостаточно прав.").send();
                
                if (!cooldowns.has(commandfile.name)) {
                    cooldowns.set(commandfile.name, new Collection());
                }

                const currentTime = Date.now();
                const time_stamps = cooldowns.get(commandfile.name);
                const cooldownAmount = (commandfile.cooldown || 1.5) * 1000;

                if (time_stamps.has(message.author.id)) {
                    const expire = time_stamps.get(message.author.id) + cooldownAmount;
                    if (currentTime < expire) {
                        const time = (expire - currentTime) / 1000;

                        return Embed(message).setAuthor({name: "💣 | Вы слишком часто пользуете эту команду!"}).setError(`Подождите пожалуйста ещё **${time.toFixed(1)}** секунд.`).send();
                    }
                }

                time_stamps.set(message.author.id, currentTime);
                setTimeout(() => time_stamps.delete(message.author.id), cooldownAmount);
                
                commandfile.run({client, args, msg: message, prefix, methods, sd});
            }
        }
    }

})

export class Methods {
    constructor (
        private readonly prefix: string,
        private readonly client: Client
    ) {}

    getCommand (commandName: string): MessageCommandOptions {
        const cmd = (this.client.messageCommands.get(commandName) || this.client.messageCommands.get(this.client.messageCommandAliases.get(commandName)));
        if (cmd) return cmd;
        return undefined;
    }

    createError(message: Message, errorMessage: string, commandName?: string): EmbedMessage {
        const emb = Embed(message).addField((ERROR_EMOJI || "❌") + " Ошибка", errorMessage.endsWith(".") || errorMessage.endsWith("!") ? errorMessage : errorMessage + ".").setError("any");
        emb.description = undefined;

        const cmd = (this.client.messageCommands.get(commandName) || this.client.messageCommands.get(this.client.messageCommandAliases.get(commandName))) as MessageCommandOptions;
                
        if (commandName && cmd) {
            const obj = this.createExamples(commandName, true);
            if (typeof obj === "string") {
                emb.addField("Примеры", obj)
            } else {
                emb.addField("Параметры", obj.params).addField("Примеры", obj.examples)
            }

            if (cmd?.aliases?.length > 0) emb.addField("Синонимы", "```" + cmd.aliases.join(", ") + "```")
        }
        return emb;
    }

    createExamples(commandName: string, params?: boolean): string | {examples: string, params: string} {
        var text = "Нет примеров";
        const cmd = (this.client.messageCommands.get(commandName) || this.client.messageCommands.get(this.client.messageCommandAliases.get(commandName))) as MessageCommandOptions;
        if (!cmd) return "```" + text + "```";
        
        if (cmd?.examples?.length > 0) text = [cmd.name, ...cmd.examples].join("\n").replaceAll("{prefix}", this.prefix);
        if (params && cmd?.params?.length > 0) {
            return {
                examples: "```" + text + "```",
                params: "```" + cmd.params.map(string => `${this.prefix}${cmd.name} ${string}`).join("\n") + "```"
            } as {examples: string, params: string}
        }
        return "```" + text + "```";
    }
}
