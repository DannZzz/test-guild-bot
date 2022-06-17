import { ColorResolvable, EmojiResolvable, GuildResolvable } from "discord.js";
import { ColorObject } from "./typings/interfaces";

export const BOT_TOKEN: string = process.env.BOT_TOKEN || ""; // Токен бота
export const MONGO_URI: string = process.env.MONGO_URI || ""; // Ссылка на базу данных

export const ALLOW_GIVING_GUILD_ROLE_WHILE_JOINING: boolean = true; // Разрешить выдавать роли гильдий сразу, когда участник заходит в гильдию
export const ERROR_EMOJI: EmojiResolvable = "❌"; // Смайл при ошибок
export const SUCCESS_EMOJI: EmojiResolvable = "✅"; // Смайл при удачных действий
export const DEFAULT_PREFIX: string = "!"; // Префикс по умолчанию
export const GUILD_NAME_MAX_LENGTH: number = +process.env.GUILD_NAME_MAX_LENGT || 25; // Максимальная длина названий гильдий
export const GUILD_DESCRIPTION_MAX_LENGTH: number = +process.env.GUILD_DESCRIPTION_MAX_LENGTH || 200; // Максимальная длина описаний гильдий
export const GUILD_MEMBERS_MAX_SIZE: number = +process.env.GUILD_MEMBERS_MAX_SIZE || 500; // Максимальная вместимость участников гильдий
export const PAGINATION_EMOJIS: EmojiResolvable[] = ["⏮", "⏪", "⏩", "⏭"]; // Смайлы для создания страниц (топы, заявки, тд...), Очереди не менять! ["⏮", "⏪", "⏩", "⏭"]
export const AWARDS_MAX_LENGTH: number = +process.env.AWARDS_MAX_LENGTH || 40; // Максимальная длина наград, типа "Самый лучший клуб" - 17 символов
export const GUILD_LEADER_EMOJI: EmojiResolvable = process.env.GUILD_LEADER_EMOJI || "💠"; // Значок владельца(лидера) гильдии
export const GUILD_HELPER_EMOJI = process.env.GUILD_HELPER_EMOJI || "🔶"; // Значок Хелпера
export const BOX_EMOJI: EmojiResolvable = process.env.BOX_EMOJI || "🎁"; // Значок боксов
export const GUILD_EMOJI: EmojiResolvable = process.env.GUILD_EMOJI || "🛡"; // Значок гильдии
export const LEVEL_EMOJI: EmojiResolvable = process.env.LEVEL_EMOJI || "🔝"; // Значок уровня в команде user
export const MAX_LENGTH_USER_DESCRIPTION: number = +process.env.MAX_LENGTH_USER_DESCRIPTION || 500; // Максимальная допустимая длина описаний профилей
export const GUILD_CREATION_MAX_LIMIT: number = +process.env.GUILD_CREATION_MAX_LIMIT || 200;  // Максимальное количество создаваемых гильдий
export const REQUESTS_COOLDOWN_MINUTES: number = +process.env.REQUESTS_COOLDOWN_MINUTES || 15; // Количество минут для кулдаунов при вступлений заявками, типа чтобы не заспамили заявками
export const XP_ADD_ONE_TIME_IN_MINUTES: {add: number, time: number} = {
    add: +process.env.XP_FOR_MESSAGE || 10, // 10 опыта за одно сообщение в течение
    time: +process.env.ONE_MESSAGE_IN || 30, // 30-и секунд
}
export const UNION_DECLINED_COOLDOWN: string = `${process.env.UNION_DECLINED_COOLDOWN || 2}h` // Количество часов кулдауна после отклонение предложений союза
export const XP_BOOST_IF_USER_GUILD_HAS_UNION: number = +process.env.XP_BOOST_IF_USER_GUILD_HAS_UNION || 0.2; // + 0.2 к росту опыта если гильдия участника в союзе
export const ONE_DAY_REWARD: number = +process.env.ONE_DAY_REWARD || 100; // Ежедневная награда для первого дня и потом рост: 1д - 100, 2д - 200, 3д - 300...
export const DEFAULT_BOOST_AMOUNT: number = +process.env.DEFAULT_BOOST_AMOUNT || 1; // Дефолтный прирост опыта
export const BOOST_SHOP: {cost: number, duration: string, visual?: string}[] = [ // Бусты профиля, длительность и цена, а также визуальные тексты для показа в сообщений
    {
        cost: 5000,
        duration: "24h"
    },
    {
        cost: 20000,
        visual: "~~25,000~~ 20,000",
        duration: "5d"
    },
    {
        cost: 100000,
        visual: "~~150,000~~ 100,000",
        duration: "30d"
    }
]

export const BOX_RANDOM_REWARD: {chance: number, type: "xp" | "boost", min?: number, max?: number}[] = [
    {
        chance: 100, // ЭТУ ОСТАВИТЬ 100!!  Шанс в процентах
        type: "xp", // Тип приза (не менять)
        min: 100, // от мин. Типа рандомное число между 100 и 300
        max: 300 // до макс.
    },
    {
        chance: 15, // Шанс в процентах
        type: "boost", // Тип приза (не менять)
        min: 10, // если тип приза boost, то эти мин и макс считаются как минуты
        max: 4 * 60 // до 240 минут (4 часов)
    },
    {
        chance: 5, // Шанс 5%
        type: "boost", // Рандомный буст
        min: 8 * 60, // от 8 часов
        max: 12 * 60 // до 12 часов
    }

]

// Валюта
export const CURRENCY = { // Эмодзи основных валют
    main: process.env.MAIN_CURRENCY || "✨"
}

export const COLORS: ColorObject = {
    main: (process.env.COLOR_MAIN as ColorResolvable) || "DARK_NAVY", // Основной цвет EMBED команд бота
    error: (process.env.COLOR_ERROR as ColorResolvable) || "DARK_RED", // Цвет ошибок EMBED
    success: (process.env.COLOR_SUCCESS as ColorResolvable) || "DARK_GREEN", // Цвет при удачных выполнянных действий EMBED
    // Можете добавить и другие цвета (если конечно шарите, как ими пользоваться в коде)

    // purpledark: "#6a006a",
    // purplemedium: "#a958a5",
    // purplelight: "#c481fb",
    // orange: "#ffa500",
    // gold: "#daa520",
    // reddark: "#CF3333",
    // redlight: "#ff0000",
    // bluedark: "#3b5998",
    // cyan: "#00ffff",
    // bluelight: "#ace9e7",
    // aqua: "#33a1ee",
    // pink: "#ff9dbb",
    // greendark: "#2ac075",
    // greenlight: "#84B354",
    // white: "#f9f9f6",
    // cream: "#ffdab9",
    // none: "#2f3136"
}