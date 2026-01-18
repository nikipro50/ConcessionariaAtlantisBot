import TelegramBot from "node-telegram-bot-api";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import { ROLE_ICONS, ROLES_ORDER, SECONDARY_ROLES } from "../configs/RoleConfiguration";

export default class GerarchiaComamnd {
    public constructor(private bot: TelegramBot) {
        bot.onText(/^\/gerarchia/i, async (msg: TelegramBot.Message) => await this.commandHandler(msg));
    }

    private async commandHandler(msg: TelegramBot.Message): Promise<any> {
        if (!msg.from?.id) return;
        await this.bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => { });

        const db: EmployeeRepository = new EmployeeRepository();
        const allUsers = await db.getAllEmployees();

        let message = "<blockquote><b>🚗 ɢᴇʀᴀʀᴄʜɪᴀ ᴄᴏɴᴄᴇѕѕɪᴏɴᴀʀɪᴀ ($$counter)</b></blockquote>\n\n";
        let counter = 0;
        const countedUsers = new Set<string>();

        for (const role of ROLES_ORDER) {
            const users = SECONDARY_ROLES.includes(role)
                ? allUsers.filter(u =>
                    this.parseSecondaryRoles(u.secondary_roles).includes(role)
                )
                : allUsers.filter(u => u.main_role === role);

            message += `${ROLE_ICONS[role]} (${users.length})\n`;

            if (users.length === 0) {
                message += "• //\n\n";
                continue;
            }

            for (const user of users) {
                if (!countedUsers.has(user.telegram_id)) {
                    countedUsers.add(user.telegram_id);
                    counter++;
                }

                message += `${this.parseLink(msg, user)}`;
            }

            message += "\n";
        }

        message += "\n<b>✍️ ʟᴀ ᴅɪʀᴇᴢɪᴏɴᴇ</b>\nWisy Van Lysk <i><s>(Moldina)</s></i>\nEsa De Argentis <i><s>(2lvel)</s></i>";


        this.bot.sendMessage(msg.chat.id, message.replace("$$counter", String(counter)), { parse_mode: 'HTML', disable_web_page_preview: true });
    }

    private parseLink(msg: TelegramBot.Message, user: any): string {
        return msg.chat.type === 'group' || msg.chat.type === 'supergroup' ? `• ${user.minecraft_nickname}\n` : `• <a href="tg://user?id=${user.telegram_id}">${user.minecraft_nickname}</a>\n`;;
    }

    private parseSecondaryRoles(roles?: string): string[] {
        return roles ? roles.split(",").map(r => r.trim()) : [];
    }
}