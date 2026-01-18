import TelegramBot from "node-telegram-bot-api";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import Keyboards from "./Keyboards";

export default class BasicsFunction {
    static capitalizeWords = (str: string): string => {
        return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }

    static async isEmployee(bot: TelegramBot, id: number): Promise<boolean> {
        return ['member', 'administrator', 'creator'].includes((await bot.getChatMember(Number(process.env.GROUP_ID!), id)).status);
    }

    static customMessage(message: string): string {
        return `<b>🚗 • ℂ𝕆ℕℂ𝔼𝕊𝕊𝕀𝕆ℕ𝔸ℝ𝕀𝔸</b>\n\n${message}`;
    }

    static async sendStartMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<TelegramBot.Message | null> {
        if (!msg.from || !msg.from.id) return null;

        return await bot.sendMessage(msg.from.id,
            `<b>🚗 • ℂ𝕆ℕℂ𝔼𝕊𝕊𝕀𝕆ℕ𝔸ℝ𝕀𝔸 </b>\n\n» Benvenuto <a href="tg://user?id=${msg.from.id} ">${(await new EmployeeRepository().getEmployeeByUser(String(msg.from.id))).minecraft_nickname}</a> nel bot ufficiale della <b>Concessionaria</b>!\n\n» <i>Scegli un'opzione qui sotto:</i>`,
            { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: Keyboards.getStartKeyboard() }
        );
    }

    static async editStartMessage(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
        return await bot.editMessageText(`<b>🚗 • ℂ𝕆ℕℂ𝔼𝕊𝕊𝕀𝕆ℕ𝔸ℝ𝕀𝔸 </b>\n\n» Benvenuto <a href="tg://user?id=${query.from.id} ">${(await new EmployeeRepository().getEmployeeByUser(String(query.from.id))).minecraft_nickname}</a> nel bot ufficiale della <b>Concessionaria</b>!\n\n» <i>Scegli un'opzione qui sotto:</i>`,
            { chat_id: query.message?.chat.id, message_id: query.message?.message_id, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: Keyboards.getStartKeyboard() }
        ).catch(() => { });
    }

    static async sendNoPermsMessage(bot: TelegramBot, id: number): Promise<TelegramBot.Message | null> {
        return await bot.sendMessage(id,
            `<b>🚫 • Nessun Permesso</b>\n\n<i>» Non risulti essere dipendente della <u>Conessionaria</u></i>`,
            { parse_mode: 'HTML', disable_web_page_preview: true }
        );
    }

    static calculateLeaveDays(start: Date, end: Date): number {
        const startDate = new Date(start), endDate = new Date(end);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const diff = endDate.getTime() - startDate.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    }

}
