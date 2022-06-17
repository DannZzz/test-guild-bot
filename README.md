# GUILD MANAGER +
## _Настраиваем конфигурацию в самом коде_
## Открываем файл **config.ts** в папке **src**
- Изменять значения можно после знака **=**
- Если значение по типу текста, оно обязательно должно быть между ковычек " ", ' '
- А вот числа без всякого

## Примеры
```sh
// До 
export const DEFAULT_PREFIX: string = "!"; // Префикс по умолчанию
// После
export const DEFAULT_PREFIX: string = "?"; // Префикс по умолчанию

// До
export const GUILD_NAME_MAX_LENGTH: number = +process.env.GUILD_NAME_MAX_LENGT || 25; // Максимальная длина названий гильдий
// После
export const GUILD_NAME_MAX_LENGTH: number = +process.env.GUILD_NAME_MAX_LENGT || 80; // Максимальная длина названий гильдий
```

## _Настраиваем конфигурацию в Heroku_
![s1](https://i.ibb.co/gZzLh7m/Screenshot-1.png)
![s1](https://i.ibb.co/3FcC8fG/Screenshot-2.png)
- **KEY** - это название значений
- **VALUE** - это само значение
- Просто добавляем **KEY** и **VALUE**, Значение добавляем так, как и есть, безразницы какого типа оно

## Вот KEYs

| KEY | Тип | Описание |
| --- | --- | -----|
| BOT_TOKEN | Текст | Основной токен бота |
| MONGO_URI | Текст | Ссылка на базу данных |
| ERROR_EMOJI | Текст | Эмодзи при ошибок |
| SUCCESS_EMOJI | Текст | Эмодзи при удачных действий |
| DEFAULT_PREFIX | Текст | Префикс по умолчанию |
| GUILD_NAME_MAX_LENGTH | Число | Максимальная длина названий гильдий |
| GUILD_DESCRIPTION_MAX_LENGTH | Число | Максимальная длина описаний гильдий |
| GUILD_MEMBERS_MAX_SIZE | Число | Максимальная вместимость участников гильдий |
| AWARDS_MAX_LENGTH | Число | Максимальная длина наград, типа "Самый лучший клуб" - 17 символов |
| GUILD_LEADER_EMOJI | Текст | Значок владельца(лидера) гильдии |
| GUILD_HELPER_EMOJI | Текст | Значок Хелпера |
| BOX_EMOJI | Текст | Значок боксов |
| GUILD_EMOJI | Текст | Значок гильдии |
| LEVEL_EMOJI | Текст | Значок уровня в команде user |
| MAX_LENGTH_USER_DESCRIPTION | Число | Максимальная допустимая длина описаний профилей |
| GUILD_CREATION_MAX_LIMIT | Число | Максимальное количество создаваемых гильдий |
| REQUESTS_COOLDOWN_MINUTES | Число | Количество минут для кулдаунов при вступлений заявками, типа чтобы не заспамили заявками |
| XP_FOR_MESSAGE | Число | Количество опыта за одно сообщение в течение ↓ |
| ONE_MESSAGE_IN | Число | Допустить 1 сообщениe в течении **этих** секунд: типо тут секунды (дефолт 30) |
| XP_BOOST_IF_USER_GUILD_HAS_UNION | Число | + число к росту опыта если гильдия участника в союзе |
| ONE_DAY_REWARD | Число | Ежедневная награда для первого дня и потом рост: 1д - 100, 2д - 200, 3д - 300... |
| DEFAULT_BOOST_AMOUNT | Число | Дефолтный прирост опыта |
| MAIN_CURRENCY | Текст | Эмодзи опыта |
| COLOR_MAIN | Текст | Основной цвет EMBED команд бота |
| COLOR_ERROR | Текст | Цвет ошибок EMBED |
| COLOR_SUCCESS | Текст | Цвет при удачных выполнянных действий EMBED |
| UNION_DECLINED_COOLDOWN | Число | Количество часов кулдауна после отклонение предложений союза |

## Если указываем эмодзи (смайл), то нужно еще и указать ID
- Просто перед эмодзи ставим **\\**
- А если стандартное эмодзи, то просто :pig:

![s1](https://i.ibb.co/xjtgtyT/unknown2.png)





