import { MessageEmbed } from "discord.js";
import { BOOST_SHOP, CURRENCY, DEFAULT_BOOST_AMOUNT } from "../../config";
import { Embed } from "../../structures/Embed";
import { MessageCommand } from "../../structures/MessageCommand";
import { Pagination } from "../../structures/Pagination";

export default new MessageCommand ({
    name: "shop",
    description: "магазин ролей",
    category: 4,
    async run ({msg, sd, client, prefix}) {
        const shop = sd.roleShop || [];


        const items = shop.map((item, index) => {
            return `${index+1}. <@&${item.roleId}> — ${CURRENCY.main} ${client.util.formatNumber(item.cost)}`;
        })

        const boosts = BOOST_SHOP.map((b, i) => [`${i+1}. Длительность: ${b.duration.replace("d", "д.").replace("h", "ч.")}`, `Цена: ${CURRENCY.main} ${b.visual ? b.visual : client.util.formatNumber(b.cost)}`]);

        const boostsEmbed = Embed(msg).setTitle("🔖 Бусты Профиля").setFooter({text: `${prefix}buy-boost <номер>`}).setText(`Получите **+${DEFAULT_BOOST_AMOUNT.toFixed(1)}** к росту опыта, возможность установить картинку на профиль!`);
        boosts.forEach(b => {
            boostsEmbed.addField(b[0], b[1]);
        })
        
        const roles = Embed(msg).setTitle("🔖 Наш Магазин Ролей").setFooter({text: `${prefix}buy-role <номер>`}).setText(items.length === 0 ? "Пока что пусто.." : items.join("\n"));
        
        new Pagination({embeds: [roles, boostsEmbed], validIds: [msg.author.id], message: msg, realFooter: true}).createSimplePagination();
    }
})