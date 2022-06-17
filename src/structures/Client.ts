// importing modules
import { Client } from "client-discord";
import { Collection } from "discord.js";
import { glob } from "glob";
import { promisify } from "util";
import { ClientOptions } from "../typings/interfaces";
import mongoose from "mongoose";
import { BOT_TOKEN, COLORS, MONGO_URI } from "../config";
// import { APPLICATION_ID, SLASH_GUILD } from "../config";
// import { REST } from "@discordjs/rest";
// import { Routes } from "discord-api-types/v9";
// making glob promise function
const globPromise = promisify(glob);

// creating discord bot client
const client: Client = new Client({colors: COLORS, token: BOT_TOKEN, intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES", "GUILD_VOICE_STATES"]})

// making new collections for commands and events
client.messageCommands = new Collection();
client.messageCommandAliases = new Collection();
client.slashCommands = new Collection();
client.events = new Collection();

// registering message commands (example: ?help, ?ban...)
async function registerMessageCommands (client: Client) {
    const paths: Array<string> = await globPromise(`${__dirname}/../messageCommands/*/*{.ts,.js}`);
    for (let path of paths) {
        const file = await importFile(path);
        if (!file.disabled) {
            client.messageCommands.set(file.name, file);
            if (file?.aliases?.length > 0) file.aliases.forEach(aliase => {
                client.messageCommandAliases.set(aliase, file.name);
            });
        }
    }
}

// reginstering client events;
async function registerEvents (client: Client) {
    const paths: Array<string> = await globPromise(`${__dirname}/../events/*{.ts,.js}`);
    for (let path of paths) {
        const file = await importFile(path);
        if (!file.disabled) {
            client.on(file.name, (...response) => {file.run({client, ctx: response})} )
        }
    }
}

async function load () {
    await Promise.all([
        registerEvents(client),
        registerMessageCommands(client)
    ])
}

// checking and connecting database 
client.checkMongoUri = () => Boolean(MONGO_URI);
if (client.checkMongoUri()) {
    mongoose.connect(MONGO_URI).then(() => console.log("database connected"))
} else {
    console.log("U need to connect mongo db")
}
// exports
load();
export default client;

export async function importFile (path: string ) {
    return (await import(path))?.default;
}