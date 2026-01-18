import TelegramBot from "node-telegram-bot-api";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import { hasAdminRole, ROLES_ORDER, SECONDARY_ROLES } from "../configs/RoleConfiguration";
import BaseDatabase from "../database/Database";
import BasicsFunction from "../utils/BasicsFunction";
import createLimitedInvite from "../utils/LinkMaker";

export default class PexRACommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/pexra(?:\s+(.+))?/i, async (msg, match) => {
            if (!msg.from || !msg.from?.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const text = match?.[1]?.trim();
            const args = text ? text.split(/\s+/) : [];

            if (args.length !== 1) {
                return await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Usa:</i> <code>/pexra (Nickname)</code>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );
            }

            const nickname = args[0];

            const db = new EmployeeRepository();
            const employee = await db.getEmployeeByNickname(nickname);

            if (!employee)
                return await bot.sendMessage(msg.chat.id, `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Nessun dipendente trovato con questo nome!</i>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );


            const roles = this.parseSecondaryRoles(employee.secondary_roles);
            if (roles.includes("RA"))
                return await bot.sendMessage(msg.chat.id, `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Il dipendente ha già questo ruolo!</i>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );


            roles.push("RA");
            await BaseDatabase.get().run(
                `UPDATE employees SET secondary_roles = ? WHERE minecraft_nickname = ?`,
                roles.join(","),
                nickname
            );

            await bot.sendMessage(
                msg.chat.id,
                `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Hai aggiunto il ruolo <b>RA</b> a <u>${nickname}</u>!`,
                { parse_mode: 'HTML' }
            );

            return await bot.sendMessage(
                employee.telegram_id,
                `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Ti è stato aggiunto il ruolo <b>RA</b> entra ora nel gruppo!\n\n» <a href="${await createLimitedInvite(Number(process.env.RA_ID!), 1)}">CLICCA QUI</a>`,
                { parse_mode: 'HTML' }
            );
        });
    }

    private parseSecondaryRoles(roles?: string): string[] {
        return roles ? roles.split(",").map(r => r.trim()) : [];
    }
}