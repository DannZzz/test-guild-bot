import { RoleResolvable, UserResolvable } from "discord.js";
import { model, Schema, Types } from "mongoose";

export interface GuildSchema {
    name: string
    logo?: string
    limit?: number
    privacy?: boolean
    awards?: Types.Array<string>
    leader: string
    description: string
    helpers?: string[]
    roles?: string[]
    createdAt: Date
    requests: string[]
    bans: Types.Array<string>
    guildRole: string
    cooldowns?: {[k: string]: Date}
    union: string[]
    war: string[]
    id: string
} 

export const guilds = model("guild", new Schema({
    id: String,
    name: { type: String, unique: true },
    leader: String,
    helpers: { type: Array, default: [] },
    description: { type: String, default: undefined },
    logo: { type: String, default: undefined },
    guildRole: { type: String, default: undefined },
    limit: { type: Number, default: undefined },
    privacy: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() },
    awards: { type: Array, default: [] },
    requests: { type: Array, default: [] },
    roles: { type: Array, default: [] },
    bans: { type: Array, default: [] },
    union: { type: Array, default: [] },
    war: { type: Array, default: [] },
    cooldowns: { type: Object, default: {} },
}))

export function uuid(type: "numbers" | "letters" = undefined, length: number = 12): string {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "1234567890";
    if (!length || length < 1) length = 12;
    let id = "";
    let count = 0;
    switch (type) {
        case "numbers":
            for (count; count < length; count++) {
                id += numbers[Math.floor(Math.random() * numbers.length)];
            }
            break;
        
        case "letters":
            for (count; count < length; count++) {
                id += letters[Math.floor(Math.random() * letters.length)];
            }
            break;
        
        default:
            for (count; count < length; count++) {
                id += (numbers + letters)[Math.floor(Math.random() * (numbers + letters).length)];
            }
            break;
    }
    return id;
}