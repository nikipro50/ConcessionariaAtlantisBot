import TelegramBot from "node-telegram-bot-api";
import LeaveRepository, { LeaveRow } from "../database/repo/LeaveRepository";
import DateFormatter from "../utils/DateFormatter";

const INTERVAL = 60 * 1000;

const notifyLeaveFinished = async (bot: TelegramBot, leave: LeaveRow) => {
    const message =
        `⏰ <b>Congedo Terminato</b>\n\n` +
        `👤 <u>${leave.minecraft_nickname}</u>\n` +
        `📅 Fine: ${DateFormatter.format(new Date(Number(leave.end_date)))}`;

    await bot.sendMessage(
        Number(process.env.ADMIN_ID!),
        message, { parse_mode: 'HTML', disable_web_page_preview: true }
    ).catch(() => { });
};

export const startLeaveAutoFinishSchedular = (bot: TelegramBot) => {
    const repo = new LeaveRepository();

    const runCheck = async () => {
        try {
            const finishedLeaves = await repo.autoFinishExpiredLeaves();

            for (const leave of finishedLeaves) {
                await notifyLeaveFinished(bot, leave);
            }

            if (finishedLeaves.length > 0)
                console.log(`[LEAVES] ${finishedLeaves.length} congedi chiusi automaticamente`);

        } catch (err) {
            console.error("[LEAVES] Errore auto-finish:", err);
        }
    }

    runCheck();
    setInterval(runCheck, INTERVAL);
};