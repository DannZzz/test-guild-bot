import { MessageActionRow, MessageButton } from "discord.js";
import { CURRENCY } from "../../config";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";

export default new MessageCommand ({
    name: "i-won",
    aliases: ["iwon"],
    cooldown: 10,
    examples: ["{prefix}i-won @Dann#2523 4000"],
    category: 4,
    description: "подтвердить свою победу",
    async run ({args, msg, client, methods}) {
        if (!args[0]) return methods.createError(msg, "Укажите своего противника.", "i-won").send();

        const member = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
        if (!member) return methods.createError(msg, "Участник сервера не найден!").send();

        if (!args[1] || isNaN(+args[1]) || Math.round(+args[1]) < 1) return methods.createError(msg, "Укажите ставку, на которую вы играли.", "i-won").send();
        const bet = Math.round(+args[1]);
        const buttons = [
            new MessageButton()
                .setCustomId(`duel-${msg.author.id}-${member.id}-${bet}`)
                .setLabel("Подтвердить")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId("duel-declined")
                .setLabel("Отказать")
                .setStyle("DANGER")
        ];

        const row = new MessageActionRow().addComponents(buttons);

        Embed(msg)
            .setTitle("Подтверждение Дуэли")
            .setText(`Победитель: ${msg.member} +${CURRENCY.main} ${client.util.formatNumber(bet)}\n\nПроигравший: ${member} -${CURRENCY.main} ${client.util.formatNumber(bet)}`)
            .setFooter({text: "Дождитесь администрации!"})
            .send(null, {components: [row]})
        
    }
})