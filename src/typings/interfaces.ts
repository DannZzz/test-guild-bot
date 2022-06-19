import { ClientEvents, ClientOptions as BasicClientOptions, ColorResolvable, CommandInteraction, CommandInteractionOptionResolver, Message, PermissionResolvable } from "discord.js";
import { Client } from "client-discord";
// import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Methods } from "../events/message";
import { ServerInterface } from "../database/models/serverSchema";

export interface ClientOptions extends BasicClientOptions {
    token: string, // bot token
    colors?: ColorObject, // color object like {red: "ff0000", black: "000000", "main": 00ffed}
}

export interface ColorObject {
    [key: string]: ColorResolvable
}

export type EventRunOptions<T> = {
    client: Client // client
    ctx: T[] // event response
}

export interface MessageCommandRunOptions {
    client: Client // client
    msg: Message // message class
    args: string[] // arguments
    prefix?: string // current server's prefix
    sd: ServerInterface // server data from base
    methods?: Methods // any functions or variables
    anyData?: any
}

export interface EventOptions {
    name: keyof ClientEvents, // event name
    disabled?: boolean, // disable the event
    run: (options: EventRunOptions<ClientEvents[this["name"]]>) => any // event run command
}

export interface MessageCommandOptions {
    name: string // command name
    aliases?: string[] // command aliases
    description: string // description
    category: number // category of command (number)
    params?: string[] // command parameters
    examples?: string[] // some examples for usage
    cooldown?: number // cooldown for message (sec)
    permissions?: PermissionResolvable // Permission resolvable, needed
    showHelp?: boolean // show in help command
    master?: boolean // EXP
    disabled?: boolean // disable the command
    onlyGuild?: boolean | string[] // command will work only in guilds (true), or in specific guilds ["GUILD_ID", "GUILD_ID"]
    run: (options: MessageCommandRunOptions) => any // run function
}

export interface SlashCommandRunOptions {
    client: Client,
    interaction: CommandInteraction,
    options: CommandInteractionOptionResolver,
    methods?: Object
}

// export interface SlashCommandOptionsCustom {
//     data: SlashCommandBuilder,
//     disabled?: boolean,
//     run(options: SlashCommandRunOptions): any
// }

export interface TimeData {
    minutes: number
    hours: number
    seconds: number
    milliseconds: number
    days: number
}