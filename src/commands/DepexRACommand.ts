import TelegramBot from "node-telegram-bot-api";
import { hasAdminRole, ROLES_ORDER, SECONDARY_ROLES } from "../configs/RoleConfiguration";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import BaseDatabase from "../database/Database";
import BasicsFunction from "../utils/BasicsFunction";

export default class DepexRACommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/depexra(?:\s+(.+))?/i, async (msg, match) => {
            if (!msg.from || !msg.from?.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const text = match?.[1]?.trim();
            const args = text ? text.split(/\s+/) : [];

            if (args.length < 1) {
                return await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Usa:</i> <code>/depexra (Nickname)</code>`,
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

            if (!employee.secondary_roles?.includes("RA"))
                return await bot.sendMessage(msg.chat.id, `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Il dipendente non ha questo ruolo!</i>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );

            const roles = this.parseSecondaryRoles(employee.secondary_roles).filter(r => r !== "RA");
            await BaseDatabase.get().run(
                `UPDATE employees SET secondary_roles = ? WHERE minecraft_nickname = ?`,
                roles.length ? roles.join(",") : null,
                nickname
            );

            await bot.sendMessage(
                msg.chat.id,
                `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Hai rimosso il ruolo <b>RA</b> a <u>${nickname}</u>!`,
                { parse_mode: 'HTML' }
            );

            await bot.banChatMember(msg.chat.id, Number(employee.telegram_id)).catch(async () => await bot.sendMessage(msg.chat.id, 'Il bot non ha i permessi per kickare/utente admin!'));
            return await bot.sendMessage(
                employee.telegram_id,
                `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Ti è stato rimosso il ruolo <b>RA</b>!`,
                { parse_mode: 'HTML' }
            );
        });
    }

    private parseSecondaryRoles(roles?: string): string[] {
        return roles ? roles.split(",").map(r => r.trim()) : [];
    }

    private isPrimaryRole(role: string): boolean {
        return ROLES_ORDER.includes(role) && !SECONDARY_ROLES.includes(role);
    }

    private isSecondaryRole(role: string): boolean {
        return SECONDARY_ROLES.includes(role);
    }
}