import TelegramBot from "node-telegram-bot-api";
import LeaveRepository from "../database/repo/LeaveRepository";
import BasicsFunction from "../utils/BasicsFunction";
import DateFormatter from "../utils/DateFormatter";
import { hasAdminRole } from "../configs/RoleConfiguration";

export default class CongedoListaCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/congedilista|\/congedolista/i, async (msg) => {
            if (!msg.from || !msg.from.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const leaveRepo = new LeaveRepository();
            const leaves = await leaveRepo.getLeavesHistory(); // Tutti i dipendenti

            if (!leaves || leaves.length === 0)
                return await bot.sendMessage(msg.chat.id, "📭 Nessun congedo registrato!");

            let text = "<b>📋 Lista di tutti i congedi</b>\n\n";
            for (const leave of leaves) {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                const status = leave.status === "ACTIVE" ? "Attivo" : "Finito";

                text += `👤 ${leave.minecraft_nickname}\n📅 Dal: ${DateFormatter.format(start)}\n📅 Al: ${DateFormatter.format(end)}\n🟢 Stato: ${status}\n\n`;
            }

            return await bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
        });
    }
}
