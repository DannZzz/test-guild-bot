import { Collection, MessageEmbed } from "discord.js";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";
import { MessageCommandOptions } from "../../typings/interfaces";

export default new MessageCommand ({
    name: "help",
    aliases: ["h"],
    description: "список команд",
    examples: ["{prefix}help accept"],
    category: 3,
    async run ({methods, client, msg, args, prefix}) {
        enum categories {
            "any",
            "Настройки гильдии",
            "Действия с гильдями",
            "Настройки",
            "Другое"
        }
        if (!args[0]) {
            const embeds: MessageEmbed[] = [];
            [1, 2, 3].forEach(element => {
                const texted = (client.messageCommands as Collection<string, MessageCommandOptions>).filter(data => data.category === element).map(a => `\`${a.name}\` - ${a.description}`);
                embeds.push(
                    Embed(msg)
                    .setAuthor({name: categories[element], iconURL: msg.guild.iconURL({dynamic: true})})
                    .setText(`Информация о команде: ${prefix}help <команда>\n\n${texted.join("\n")}`)
                )
            });
            
            new Pagination({embeds, timeout: 100000, validIds: [msg.author.id], message: msg}).createSimplePagination();
        } else {
            function firstUpperCase(text: string, split: string = ' '): string {
                return text.split(split).map((word, i) => i === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word).join(' ');
              }
            
            const cmd: MessageCommandOptions = client.messageCommands.get(args[0].toLowerCase()) || client.messageCommands.get(client.messageCommandAliases.get(args[0].toLowerCase()));
            if (!cmd) return methods.createError(msg, "Команда не найдена", "help");
            Embed(msg)
            .setAuthor({name: `Информаци о команде: ${cmd.name}`})
            .setText(firstUpperCase(cmd.description.endsWith(".") ? cmd.description : cmd.description+"."))
            .addField("Синонимы", cmd?.aliases?.length > 0 ? `\`\`\`${cmd.aliases.join(", ")}\`\`\`` : "Нет синонимов")
            .addField("Примеры", cmd?.examples?.length > 0 ? "```" + cmd.examples.join("\n").replaceAll("{prefix}", prefix) + "```" : "Нет примеров")
            .addField("Параметры", cmd?.params?.length > 0 ? "```" + cmd.params.map(param => `${param}`).join(", ") + "```" : "Нет параметров")
            .addField("Отдельный кулдаун", cmd?.cooldown ? `${cmd.cooldown} секунд` : "Нету")
            .send();
        }
    }
})