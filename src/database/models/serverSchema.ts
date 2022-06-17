import { Schema, model, Types } from "mongoose";

export interface ServerInterface {
    _id: string
    prefix: string
    log_channel?: string
    creator_roles: string[]
    master: string[],
    ignoreChannels: string[]
    roleShop: {roleId: string, cost: number}[]
}

export const servers = model("server", new Schema({
    _id: String,
    prefix: { type: String, default: "!" },
    log_channel: { type: String, default: undefined },
    ignoreChannels: { type: Array, default: [] },
    creator_roles: { type: Array, default: [] },
    master: { type: Array, default: [] },
    roleShop: { type: Array, default: [] },
}));
