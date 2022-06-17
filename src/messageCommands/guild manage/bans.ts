import { fetchGuild, getMemberGuild, hasPermissionsInGuild } from "../../database/db";
import { GuildSchema } from "../../database/models/guildSchema";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand ({
    name: "bans",
    description: "баны вашей гильдии",
    category: 1,
    cooldown: 3,
    run: async ({client, msg, prefix}) => {
        const guild = await getMemberGuild(msg.author.id) as GuildSchema;
        if (!guild) return Embed(msg).setError("Вы не состоите в гильдии.").send();
        if(!hasPermissionsInGuild(guild, msg.author.id)) return Embed(msg).setError("У вас недостаточно прав.").send();
        const fetch = await fetchGuild(guild.name, {bans: true});
        const texted = fetch.bans.map((id, i) => {
            var name = "Вышел из сервера";
            const member = msg.guild.members.cache.get(id);
            if (member) name = member.user.tag;
            return `**${i+1}.** ${name} (${id})`;
        });

        let i = 0;
        const embeds = []
        while (i < texted.length) {
            const sliced = texted.slice(i, i+10);
            embeds.push(Embed(msg).setAuthor({name: `🔨 | Баны ${guild.name} [${texted.length}]`}).setText(`Разбанить участника: \`${prefix}unban @Dann#1000\`\nРазбанить всех: \`${prefix}unban all\`\n\n${sliced.join("\n")}`));
            i += 10;
        }

        if (embeds.length === 0) embeds.push(Embed(msg).setAuthor({name: `🔨 | Баны ${guild.name} [${texted.length}]`}).setText(`Разбанить участника: \`${prefix}unban @Dann#1000\`\nРазбанить всех: \`${prefix}unban all\`\n\nНет забаненных :)`))

        await new Pagination({embeds, timeout: 30000, validIds: [msg.author.id], message: msg}).createSimplePagination();
    
    }
})