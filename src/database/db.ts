import { servers } from "./models/serverSchema";
import { Member, members } from "./models/memberSchema";
import { GuildMemberResolvable, UserResolvable } from "discord.js";
import { guilds, GuildSchema } from "./models/guildSchema";
import { Model } from "mongoose";
import { DEFAULT_BOOST_AMOUNT, GUILD_MEMBERS_MAX_SIZE } from "../config";
import { Levels } from "../docs/levels/levels";
export const models = {
    servers,
    members,
    guilds
}

type databaseOptions = {
    name: keyof typeof models,
    onlyCheck: boolean
}

export async function findOrCreate(databaseName: keyof typeof models | databaseOptions, ...args: any[]) {
    if (typeof databaseName === "string") {
        if (models[databaseName.toLowerCase()]) {
            const data = models[databaseName.toLowerCase()];
            var schema = await data.findOne({_id: args[0]});
            if (!schema) {
                schema = await data.create({
                    _id: args[0]
                });
                schema.save()
            }
             return schema;
        } else {
            throw new Error("Invalid model name");
        }
    } else {
        if (models[databaseName.name.toLowerCase()]) {
            const data = models[databaseName.name.toLowerCase()];
            var schema = await data.findOne({_id: args[0]});
            if (!schema && !databaseName.onlyCheck) {
                schema = await data.create({
                    _id: args[0]
                });
                schema.save()
            }
             return schema;
        } else {
            throw new Error("Invalid model name");
        }
    }
}

export async function hasBoost(userId: string) {
    const data = await findOrCreate({name: "members", onlyCheck: true}, userId) as Member;
    if (!data) return false;
    if (data?.boost?.until > new Date()) return true;
    return false;
}

export function getCurrentLevelByXp(xp: number) {
    for (let i in Levels) {
        if (Levels[i] > xp) {
            return {
                currentLevelXp: Levels[(parseInt(i) - 1)+""] as number,
                current: parseInt(i) - 1 as number,
                xpForNextLevel: Levels[i] as number
            };
        }
    }
};

export async function givePoints (memberId: string, points: number, none?: boolean) {
    var toAdd = Math.round(points);
    var addX = DEFAULT_BOOST_AMOUNT;
    const member = await findOrCreate("members", memberId) as Member;
    if (member.boost) {
        if (member.boost.until && member.boost.until > new Date()) {
            if (member.boost.addX) addX += member.boost.addX;
        }
    }

    toAdd *= addX
    
    await members.updateOne({_id: memberId}, {$inc: {points: Math.round(none ? points : toAdd)}})

}

export interface FetchGuildOptions {
    members?: boolean
    leader?: boolean
    helpers?: boolean
    bans?: boolean
}

export interface GuildFetched {
    Guild: GuildSchema
    members?: Array<Member>
    helpers?: Array<Member>
    leader?: Member
    bans?: Array<string>
}


export async function getMemberGuild(id: UserResolvable, onlyCheck?: boolean): Promise<GuildSchema | boolean> {
    const member = await findOrCreate("members", id) as Member;
    if (onlyCheck) return Boolean(member.guildName);
    return (await fetchGuild(member.guildName)).Guild;
}

export async function fetchGuild(name: string, options?: FetchGuildOptions): Promise<GuildFetched> {
    const data: GuildSchema = await guilds.findOne({name});
    const Main: GuildFetched = {
        Guild: data,
        members: [],
        helpers: [],
        bans: [],
        leader: undefined
    }
    if (!data) return Main;
    if (!options || options === {} || Object.values(options).every(ob => ob === false)) return Main;
    const { members: md = false, leader = false, helpers = false, bans = false } = options;
    if (md) {
        const guildMembers: Array<Member> = await members.find({guildName: data.name})
        // console.log(guildMembers);
        Main.members = guildMembers;
    }

    if (leader) {
        const leaderMember = await members.findOne({_id: data.leader});
        Main.leader = leaderMember as Member;
    }

    if (bans) {
        const unique = [...new Set(data.bans)];
        Main.bans = unique;
        if (unique.length !== data.bans.length) await guilds.updateOne({name: data.name}, {$set: {bans: unique}});
    }
    
    if (helpers) {
        var helpersData: Member[] = [];
        if (md) {
            Main.members.forEach(obj => {
                if (data.helpers.includes(obj._id as string)) helpersData.push(obj);
            })
        } else {
            helpersData = await members.find({_id: {$in: data.helpers}});
        }
        Main.helpers = helpersData;
    }

    return Main;
}

/**
 * 
 * @param guild Guild Schema
 * @param id User Id
 * @returns true if has permission to do something or false
 */

export async function hasPermissionsInGuild (guild: GuildSchema, id: string): Promise<boolean> {
    const fetch = await fetchGuild(guild.name, {helpers: true, leader: true});
    return Boolean(fetch.leader._id === id || fetch.helpers.some(obj => obj._id === id));
}
type ErrorIndex = number;
export async function canJoinGuild(user_id: UserResolvable, guildname: string): Promise<ErrorIndex | true | "privacy"> {
    const fetch = await fetchGuild(guildname, {members: true, bans: true});
    const memberGuild = await getMemberGuild(user_id, true);
    if (memberGuild) return 4;
    if (!fetch.Guild) return 0;
    const guild = fetch.Guild;
    if ((GUILD_MEMBERS_MAX_SIZE || 500) <= fetch.members.length) return 2;
    if (guild.bans.includes(user_id as string)) return 1;
    if (guild.limit && guild.limit <= fetch.members.length) return 3;
    if (guild.privacy) return "privacy";
    return true;
}

export enum JoinGuildErrors {
    "Гильдия не найдена.",
    "Вы забанены в этой гильдии.",
    "В гильдии недостаточно мест, попробуйте позже.",
    "В гильдии установлен лимит, и он превышен, попробуйте позже.",
    "Вы уже находитесь в другой гильдии, сначала выйдите из неё. (`leave-guild`)"
}