import { UserResolvable } from "discord.js";
import { model, Schema } from "mongoose";

export interface Member {
    _id: string
    guildName?: string
    points?: number
    voice?: number
    cooldowns: {}
    boost: {until: Date, addX: number}
    daily: {last: Date, day: number}
    box?: number
    duelsPlayed: number
    duelsWon?: number
    avatarUrl: string;
    description: string;
}

export const members = model("member", new Schema({
    _id: String,
    guildName: { type: String, default: undefined },
    avatarUrl: { type: String, default: undefined },
    description: { type: String, default: undefined },
    points: { type: Number, default: 0 },
    voice: { type: Number, default: 0 },
    box: { type: Number, default: 0 },
    duelsPlayed: { type: Number, default: 0 },
    duelsWon: { type: Number, default: 0 },
    cooldowns: { type: Object, default: {} },
    daily: { type: Object, default: {} },
    boost: { type: Object, default: {until: null, addX: 0} },
}))
