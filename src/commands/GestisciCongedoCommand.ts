import TelegramBot from "node-telegram-bot-api";
import LeaveRepository from "../database/repo/LeaveRepository";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import BasicsFunction from "../utils/BasicsFunction";
import DateFormatter from "../utils/DateFormatter";
import { hasAdminRole } from "../configs/RoleConfiguration";

export default class GestisciCongedoCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/gestiscicongedo(?:\s+(.+))?/i, async (msg, match) => {
            if (!msg.from || !msg.from.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const employees = new EmployeeRepository();
            const leaveRepo = new LeaveRepository();

            let nickname = match?.[1]?.trim();
            if (!nickname) return await bot.sendMessage(msg.chat.id, "❌ Devi indicare un nickname: /gestiscicongedo [nick]");

            if (!await employees.isEmployee(nickname)) return await bot.sendMessage(msg.chat.id, "❌ Dipendente non trovato!");

            const leaves = await leaveRepo.getLeaveHistory(nickname);
            if (leaves.length === 0) return await bot.sendMessage(msg.chat.id, "📭 Nessun congedo per questo dipendente!");

            const keyboard = leaves.map((l, i) => [{
                text: `#${i + 1} Dal: ${DateFormatter.format(new Date(l.start_date))} Al: ${DateFormatter.format(new Date(l.end_date))}`,
                callback_data: `gestisci_select_${nickname}_${i}`
            }]);

            await bot.sendMessage(msg.chat.id, `<b>📋 Gestisci Congedi di: ${nickname}</b>\n\nSeleziona il congedo da gestire:`, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
        });
    }
}
