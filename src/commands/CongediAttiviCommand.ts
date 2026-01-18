import TelegramBot from "node-telegram-bot-api";
import LeaveRepository from "../database/repo/LeaveRepository";
import BasicsFunction from "../utils/BasicsFunction";
import DateFormatter from "../utils/DateFormatter";
import { hasAdminRole } from "../configs/RoleConfiguration";

export default class CongediAttiviCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/congediattivi/i, async (msg) => {
            if (!msg.from || !msg.from.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const leaveRepo = new LeaveRepository();
            const allLeaves = await leaveRepo.getLeavesHistory();
            const activeLeaves = allLeaves.filter(l => l.status === "ACTIVE");

            if (!activeLeaves || activeLeaves.length === 0)
                return await bot.sendMessage(msg.chat.id, "📭 Nessun congedo attivo!");

            let text = "<b>📋 Lista Congedi Attivi (" + activeLeaves.length + ")</b>\n\n";
            for (const leave of activeLeaves) {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                const now = new Date();
                const daysLeft = Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                text += `👤 ${leave.minecraft_nickname}\n📅 Dal: ${DateFormatter.format(start)}\n📅 Al: ${DateFormatter.format(end)}\n⏱ Giorni mancanti: ${daysLeft}\n\n`;
            }

            return await bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
        });
    }
}
