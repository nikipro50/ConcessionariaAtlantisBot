import TelegramBot from "node-telegram-bot-api";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import BasicsFunction from "../utils/BasicsFunction";
import { hasAdminRole } from "../configs/RoleConfiguration";

export default class StartCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/start/i, async (msg: TelegramBot.Message) => {
            if (msg.chat.type === "group" || msg.chat.type === "supergroup") return;
            if (!msg.from || !msg.from.id) return;
            await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => { });


            if (!await BasicsFunction.isEmployee(bot, msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const employees: EmployeeRepository = new EmployeeRepository();
            if (!await employees.isEmployeeFromId(String(msg.from.id)))
                return await bot.sendMessage(msg.from.id,
                    BasicsFunction.customMessage(`» Benvenuto <a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>, per utilizzare correttamente tutte le funzioni del bot <u>devi registrarti</u>.\n\n<b>Clicca qui sotto per farlo!</b>`),
                    { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: `➕ • Registrati`, callback_data: 'registrati' }]] } }
                );

            return await BasicsFunction.sendStartMessage(bot, msg);
        });
    }
}
