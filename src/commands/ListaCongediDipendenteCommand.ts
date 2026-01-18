import TelegramBot from "node-telegram-bot-api";
import LeaveRepository from "../database/repo/LeaveRepository";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import BasicsFunction from "../utils/BasicsFunction";
import DateFormatter from "../utils/DateFormatter";
import { hasAdminRole } from "../configs/RoleConfiguration";

export default class ListaCongediDipendenteCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/listacongedi (.+)/i, async (msg, match) => {
            if (!msg.from || !msg.from.id) return;
            if (!match || !match[1]) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const nickname = match[1].trim();
            const employees = new EmployeeRepository();
            if (!await employees.isEmployee(nickname)) return await bot.sendMessage(msg.chat.id, "❌ Dipendente non trovato!");

            const leaveRepo = new LeaveRepository();
            const leaves = await leaveRepo.getLeaveHistory(nickname);

            if (leaves.length === 0) return await bot.sendMessage(msg.chat.id, "📭 Nessun congedo registrato per questo dipendente!");

            let text = `<b>📋 Lista congedi di: ${nickname}</b>\n\n`;
            for (const leave of leaves) {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                const status = leave.status === "ACTIVE" ? "Attivo" : "Finito";

                text += `📅 Dal: ${DateFormatter.format(start)}\n📅 Al: ${DateFormatter.format(end)}\n🟢 Stato: ${status}\n\n`;
            }

            return await bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
        });
    }
}
