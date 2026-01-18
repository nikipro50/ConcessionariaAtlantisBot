import TelegramBot from "node-telegram-bot-api";
import { hasAdminRole, ROLES_ORDER, SECONDARY_ROLES } from "../configs/RoleConfiguration";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import BaseDatabase from "../database/Database";
import BasicsFunction from "../utils/BasicsFunction";

export default class DepexCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/depex(?:\s+(.+))?$/i, async (msg, match) => {
            if (!msg.from || !msg.from?.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const text = match?.[1]?.trim();
            const args = text ? text.split(/\s+/) : [];

            if (args.length < 1) {
                return await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Usa:</i> <code>/depex (Nickname) [Ruolo]</code>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );
            }

            const nickname = args[0];
            const role: string | undefined = args[1] ? args[1].toUpperCase() : undefined;

            const db = new EmployeeRepository();
            const employee = await db.getEmployeeByNickname(nickname);

            if (!employee)
                return await bot.sendMessage(msg.chat.id, `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Nessun dipendente trovato con questo nome!</i>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );

            if (!role) {
                await BaseDatabase.get().run(
                    `DELETE FROM employees WHERE minecraft_nickname = ?`,
                    nickname
                );

                await bot.sendMessage(
                    employee.telegram_id,
                    `<blockquote>🚫 • ʟɪᴄᴇɴᴢɪᴀᴍᴇɴᴛᴏ</blockquote>\n\n» Hai licenziato ${nickname}!`,
                    { parse_mode: 'HTML' }
                );

                return await bot.sendMessage(
                    employee.telegram_id,
                    `<blockquote>🚫 • ʟɪᴄᴇɴᴢɪᴀᴍᴇɴᴛᴏ</blockquote>\n\n» Sei stato licenziato, hai perso il tuo incarico!`,
                    { parse_mode: 'HTML' }
                );
            }

            if (this.isPrimaryRole(role))
                return await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Non puoi depexare solo dal ruolo primario, usa solo <code>/depex (Nickname)</code>.</i>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );

            if (this.isSecondaryRole(role)) {
                const roles = this.parseSecondaryRoles(employee.secondary_roles).filter(r => r !== role);
                const prettyRole: string = BasicsFunction.capitalizeWords(role.replace("_", " "));

                await BaseDatabase.get().run(
                    `UPDATE employees SET secondary_roles = ? WHERE minecraft_nickname = ?`,
                    roles.length ? roles.join(",") : null,
                    nickname
                );

                await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Hai rimosso il ruolo <b>${prettyRole}</b> a <u>${nickname}</u>!`,
                    { parse_mode: 'HTML' }
                );

                return await bot.sendMessage(
                    employee.telegram_id,
                    `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Ti è stato rimosso il ruolo <b>${prettyRole}</b>!`,
                    { parse_mode: 'HTML' }
                );
            }

            return await bot.sendMessage(msg.chat.id, `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Nessun ruolo trovato con questo nome!</i>`,
                { parse_mode: 'HTML', disable_web_page_preview: true }
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