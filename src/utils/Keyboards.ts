import TelegramBot from "node-telegram-bot-api";
import BasicsFunction from "./BasicsFunction";

export default class Keyboards {
    static getStartKeyboard(): TelegramBot.InlineKeyboardMarkup {
        return { inline_keyboard: [[{ text: `❄️ • Congedo`, callback_data: 'congedo' }], [{ text: `🧾 • Preordine`, callback_data: 'preordina' }]] };
    }

    static getBackKeyboard(): TelegramBot.InlineKeyboardMarkup {
        return { inline_keyboard: [[{ text: '⬅️ • Indietro', callback_data: 'back' }]] }
    }

    static getHomeKeyboard(): TelegramBot.InlineKeyboardMarkup {
        return { inline_keyboard: [[{ text: '⬅️ • Indietro', callback_data: 'back' }]] }
    }
}
