import TelegramBot from "node-telegram-bot-api";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import { hasAdminRole, ROLES_ORDER, SECONDARY_ROLES } from "../configs/RoleConfiguration";
import BaseDatabase from "../database/Database";
import BasicsFunction from "../utils/BasicsFunction";

export default class PexCommand {
    public constructor(bot: TelegramBot) {
        bot.onText(/^\/pex(?:\s+(.+))?$/i, async (msg: TelegramBot.Message, match) => {
            if (!msg.from || !msg.from?.id) return;

            if (!await hasAdminRole(msg.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, msg.from.id);

            const text = match?.[1]?.trim();
            const args = text ? text.split(/\s+/) : [];

            if (args.length !== 2) {
                return await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Usa:</i> <code>/pex (Nickname) (Ruolo)</code>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );
            }

            const nickname = args[0];
            const role = args[1].toUpperCase();

            const db = new EmployeeRepository();
            const employee = await db.getEmployeeByNickname(nickname);

            if (!employee)
                return await bot.sendMessage(msg.chat.id, `<blockquote>🚫 • ѕɪɴᴛᴀѕѕɪ ᴇʀʀᴀᴛᴀ</blockquote>\n\n» <i>Nessun dipendente trovato con questo nome!</i>`,
                    { parse_mode: 'HTML', disable_web_page_preview: true }
                );

            const prettyRole: string = BasicsFunction.capitalizeWords(role.replace("_", " "));
            if (this.isPrimaryRole(role)) {
                await BaseDatabase.get().run(
                    `UPDATE employees SET main_role = ? WHERE minecraft_nickname = ?`,
                    role,
                    nickname
                );

                await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Hai aggiornato il ruolo di <u>${nickname}</u> a <b>${prettyRole}</b>!`,
                    { parse_mode: 'HTML' }
                );

                return await bot.sendMessage(
                    employee.telegram_id,
                    `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Il tuo ruolo è stato aggiornato a <b>${prettyRole}</b>!`,
                    { parse_mode: 'HTML' }
                );
            }

            if (this.isSecondaryRole(role)) {
                const roles = this.parseSecondaryRoles(employee.secondary_roles);
                if (!roles.includes(role)) roles.push(role);

                await BaseDatabase.get().run(
                    `UPDATE employees SET secondary_roles = ? WHERE minecraft_nickname = ?`,
                    roles.join(","),
                    nickname
                );

                await bot.sendMessage(
                    msg.chat.id,
                    `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Hai aggiunto il ruolo <b>${prettyRole}</b> a <u>${nickname}</u>!`,
                    { parse_mode: 'HTML' }
                );

                return await bot.sendMessage(
                    employee.telegram_id,
                    `<blockquote>🔄 • ʀᴜᴏʟᴏ ᴀɢɢɪᴏʀɴᴀᴛᴏ</blockquote>\n\n» Ti è stato aggiunto il ruolo <b>${prettyRole}</b>!`,
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