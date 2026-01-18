import TelegramBot from "node-telegram-bot-api";
import BasicsFunction from "../utils/BasicsFunction";
import EmployeeRepository from "../database/repo/EmployeeRepository";
import DateParser from "../utils/DateParser";
import DateFormatter from "../utils/DateFormatter";
import { addLeave, getLeave, removeLeave } from "../storage/LeaveCache";
import LeaveRepository from "../database/repo/LeaveRepository";
import PreorderRepository from "../database/repo/PreorderRepository";
import { addPreorder, getPreorder, removePreorder } from "../storage/PreorderCache";
import Keyboards from "../utils/Keyboards";

export default class LeaveCallback {
    public constructor(bot: TelegramBot) {
        const actions: number[] = [];
        const listeners: Map<number, (msg: TelegramBot.Message) => void> = new Map();

        const removeAction = (id: number) => {
            const index = actions.indexOf(id);
            if (index !== -1) actions.splice(index, 1);
        };

        const waitUserMessage = async (userId: number, chatId: number, timeoutMs = 5 * 60_000) => {
            return new Promise<TelegramBot.Message>((resolve, reject) => {
                const handler = (msg: TelegramBot.Message) => {
                    if (msg.chat.type === "private" &&
                        msg.from?.id === userId &&
                        msg.chat.id === chatId &&
                        actions.includes(userId) &&
                        !msg.text?.startsWith("/")
                    ) {
                        bot.removeListener("message", handler);
                        listeners.delete(userId);
                        clearTimeout(timeout);
                        resolve(msg);
                    }
                };

                const timeout = setTimeout(() => {
                    bot.removeListener("message", handler);
                    listeners.delete(userId);
                    removeAction(userId);
                    reject(new Error("⏱ Nessun messaggio ricevuto! Azione annullata."));
                }, timeoutMs);

                listeners.set(userId, handler);
                bot.on("message", handler);
            });
        };

        bot.on("callback_query", async (query: TelegramBot.CallbackQuery) => {
            if (!query?.message || !query.from || !query.data) return;
            if (!await BasicsFunction.isEmployee(bot, query.from.id)) return await BasicsFunction.sendNoPermsMessage(bot, query.from.id);

            const employees = new EmployeeRepository();
            const employee = await employees.getEmployeeByUser(String(query.from.id));
            if (!employee && query.data !== 'registrati')
                return await bot.sendMessage(query.from.id, '<b>Non risulti autenticato, scrivi /start per effettuare la registrazione!</b>', { parse_mode: 'HTML' }).catch(() => { });

            const leavesRepo = new LeaveRepository();
            const preorderRepo = new PreorderRepository();

            if (query.data === 'registrati') {
                const employees = new EmployeeRepository();

                if (await employees.isEmployeeFromId(String(query.from.id))) {
                    return await BasicsFunction.editStartMessage(bot, query);
                }

                actions.push(query.from.id);

                await bot.editMessageText(
                    BasicsFunction.customMessage(`<i>Scrivi il tuo nickname in-game...</i>`),
                    { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'HTML', disable_web_page_preview: true }
                );

                const nicknameMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                await bot.deleteMessage(nicknameMsg.chat.id, nicknameMsg.message_id).catch(() => { });

                await bot.editMessageText(
                    BasicsFunction.customMessage(`<i>Scrivi il tuo nome in lore...</i>`),
                    { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'HTML', disable_web_page_preview: true }
                );

                const loreNameMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                await bot.deleteMessage(loreNameMsg.chat.id, loreNameMsg.message_id).catch(() => { });

                await bot.editMessageText(
                    BasicsFunction.customMessage(`<i>Scrivi il tuo cognome in lore...</i>`),
                    { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'HTML', disable_web_page_preview: true }
                );

                const loreSurnameMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                await bot.deleteMessage(loreSurnameMsg.chat.id, loreSurnameMsg.message_id).catch(() => { });

                await employees.createEmployee({
                    minecraftNickname: String(nicknameMsg.text),
                    telegramId: String(query.from.id),
                    loreFirstName: String(loreNameMsg.text),
                    loreLastName: String(loreSurnameMsg.text),
                    mainRole: 'STAGISTA'
                });

                removeAction(query.from.id);

                return await BasicsFunction.editStartMessage(bot, query);
            }


            if (query.data === "congedo") {
                actions.push(query.from.id);

                const existingLeave = await leavesRepo.getActiveLeave(employee.minecraft_nickname);
                if (existingLeave)
                    return await bot.answerCallbackQuery(query.id, { text: '🟡 Hai già un congedo in approvazione!', show_alert: true }).catch(async () => await bot.sendMessage(query.from.id, '🟡 Hai già un congedo in approvazione!'));

                await bot.editMessageText(
                    "<b>❄️ • Congedo</b>\n\n<i>» Inserisci la data d'inizio del congedo (dd/MM/yyyy):</i>",
                    {
                        chat_id: query.message.chat.id,
                        message_id: query.message.message_id,
                        parse_mode: "HTML",
                        reply_markup: { inline_keyboard: [[{ text: "⬅️ • Indietro", callback_data: "back" }]] }
                    }
                );

                try {
                    const startMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                    await bot.deleteMessage(startMsg.chat.id, startMsg.message_id).catch(() => { });

                    const startDate = DateParser.parse(startMsg.text!);
                    if (!startDate || DateParser.isPast(startDate))
                        throw new Error("❌ Data d'inizio non valida!");

                    await bot.editMessageText(
                        "<b>❄️ • Congedo</b>\n\n<i>» Inserisci la data di fine del congedo (dd/MM/yyyy):</i>",
                        {
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            parse_mode: "HTML",
                            reply_markup: { inline_keyboard: [[{ text: "⬅️ • Indietro", callback_data: "back" }]] }
                        }
                    );


                    const endMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                    await bot.deleteMessage(endMsg.chat.id, endMsg.message_id).catch(() => { });

                    const endDate = DateParser.parse(endMsg.text!);
                    if (!endDate || endDate < startDate) throw new Error("❌ Data di fine non valida!");

                    addLeave(query.from.id, startMsg.text!, endMsg.text!);
                    removeAction(query.from.id);

                    await bot.editMessageText(
                        `<b>❄️ • Congedo</b>\n\n<i>» Conferma il congedo:</i>\n👤 • Nome: <b>${employee.minecraft_nickname}</b>\n🗓 • Data di Inizio: <b>${startMsg.text}</b>\n🗓 • Data di Fine: <b>${endMsg.text}</b>`,
                        {
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            parse_mode: "HTML",
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: "✅ • Conferma", callback_data: "congedo_conferma" },
                                        { text: "🚫 • Annulla", callback_data: "congedo_annulla" }
                                    ]
                                ]
                            }
                        }
                    );
                } catch (err: any) {
                    removeAction(query.from.id);
                    return await bot.editMessageText(
                        `<b>❄️ • Congedo</b>\n\n<i>${err.message}</i>`,
                        { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: "HTML" }
                    );
                }
            }

            if (query.data === "congedo_conferma") {
                const leave = getLeave(query.from.id);
                if (!leave) return await bot.answerCallbackQuery(query.id, { text: "🚫 Richiesta troppo vecchia", show_alert: true });

                const employee = await employees.getEmployeeByUser(String(query.from.id));
                const startDate = DateParser.parse(leave.startDate)!;
                const endDate = DateParser.parse(leave.endDate)!;

                const leaveId = await leavesRepo.createLeave(employee.minecraft_nickname, startDate, endDate);
                removeLeave(query.from.id);

                const start = new Date(startDate);
                const end = new Date(endDate);
                const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const secondaryRole = employee.secondary_roles ?? "//";

                await bot.sendMessage(
                    Number(process.env.ADMIN_ID!),
                    `<b>❄️ • Nuova richiesta congedo!</b>\n\nN° Cong.: <b>${await leavesRepo.getLeaveCountByEmployee(employee.minecraft_nickname)} / ${await leavesRepo.getTotalLeaveCount()}</b>\n👤 Nick: <b>${employee.minecraft_nickname}</b>\n🎖 Ruolo: <b>${BasicsFunction.capitalizeWords(employee.main_role.toLowerCase().replace("_", " "))}</b>\n🧩 Ruolo Secondario: <b>${BasicsFunction.capitalizeWords(secondaryRole.toLowerCase().replace("_", " "))}</b>\n📅 Data inizio: <b>${leave.startDate}</b>\n📅 Data fine: <b>${leave.endDate}</b>\n⏱ Giorni: <b>${days}</b>`,
                    {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "✅ • Approva", callback_data: `leave_approve_${leaveId}` },
                                    { text: "❌ • Rifiuta", callback_data: `leave_reject_${leaveId}` }
                                ]
                            ]
                        }
                    }
                );

                return await bot.editMessageText(
                    `<b>❄️ • Congedo</b>\n\n<i>✅ La tua richiesta è stata inviata!</i>`,
                    { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: "HTML" }
                );
            }

            if (query.data?.startsWith("leave_approve_") || query.data?.startsWith("leave_reject_")) {
                const [_, action, leaveIdStr] = query.data.split("_");
                const leaveId = Number(leaveIdStr);
                if (isNaN(leaveId)) return;

                const leave = await leavesRepo.getLeaveById(leaveId);
                if (!leave) return await bot.answerCallbackQuery(query.id, { text: "❌ Congedo non trovato", show_alert: true });

                const employee = await employees.getEmployeeByNickname(leave.minecraft_nickname);

                if (action === "approve") await leavesRepo.approveLeave(leaveId);
                else await leavesRepo.finishLeave(leave.minecraft_nickname);

                await bot.editMessageReplyMarkup(
                    { inline_keyboard: [[{ text: action === "approve" ? "✅ • Approvato" : "❌ • Rifiutato", callback_data: "done" }]] },
                    { chat_id: query.message.chat.id, message_id: query.message.message_id }
                ).catch(() => { });

                if (employee?.telegram_id)
                    await bot.sendMessage(
                        Number(employee.telegram_id),
                        `<b>❄️ • Congedo ${action === "approve" ? "approvato" : "rifiutato"}</b>\n📅 Dal <b>${DateFormatter.format(leave.start_date)}</b>\n📅 Al <b>${DateFormatter.format(leave.end_date)}</b>`,
                        { parse_mode: "HTML" }
                    );

                return await bot.answerCallbackQuery(query.id, { text: action === "approve" ? "✅ Congedo approvato" : "❌ Congedo rifiutato" });
            }

            if (query.data === "congedo_annulla" || query.data === "back") {
                removeAction(query.from.id);
                const handler = listeners.get(query.from.id);
                if (handler) bot.removeListener("message", handler);
                listeners.delete(query.from.id);
                return await BasicsFunction.editStartMessage(bot, query);
            }
            if (query.data.startsWith("gestisci_select_")) {
                const parts = query.data.split("_");
                const nickname = parts[2];
                const index = Number(parts[3]);
                if (isNaN(index)) return;

                const leaves = await leavesRepo.getLeaveHistory(nickname);
                if (!leaves || index >= leaves.length)
                    return await bot.answerCallbackQuery(query.id, { text: "❌ Congedo non trovato!", show_alert: true });

                const leave = leaves[index];
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);

                const keyboard = [
                    [
                        { text: "🚫 Annulla", callback_data: `gestisci_action_cancel_${nickname}_${index}` },
                        { text: "🗑 Elimina", callback_data: `gestisci_action_delete_${nickname}_${index}` },
                        //  { text: "⚪ Niente", callback_data: `gestisci_action_niente_${nickname}_${index}` }
                    ]
                ];

                await bot.editMessageText(
                    `<b>📋 Gestione Congedo</b>\n\n👤 Nick: <b>${nickname}</b>\nN° Cong.: <b>${index + 1}</b>\n📅 Dal: <b>${DateFormatter.format(start)}</b>\n📅 Al: <b>${DateFormatter.format(end)}</b>`,
                    { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } }
                );

                return await bot.answerCallbackQuery(query.id);
            }

            // AZIONE CONGEDO
            if (query.data.startsWith("gestisci_action_")) {
                const parts = query.data.split("_");
                const action = parts[2]; // cancel | delete | niente
                const nickname = parts[3];
                const index = Number(parts[4]);
                if (isNaN(index)) return;

                const leaves = await leavesRepo.getLeaveHistory(nickname);
                if (!leaves || index >= leaves.length) return;

                const leave = leaves[index];

                if (action === "delete") {
                    await leavesRepo.finishLeave(leave.minecraft_nickname);
                    await bot.editMessageText(`✅ Congedo #${index + 1} di ${nickname} eliminato!`, { chat_id: query.message.chat.id, message_id: query.message.message_id });
                } else if (action === "cancel") {
                    await bot.editMessageText(`❌ Azione annullata per il congedo #${index + 1} di ${nickname}`, { chat_id: query.message.chat.id, message_id: query.message.message_id });
                } else if (action === "niente") {
                    await bot.editMessageText(`⚪ Nessuna azione eseguita sul congedo #${index + 1} di ${nickname}`, { chat_id: query.message.chat.id, message_id: query.message.message_id });
                }

                return await bot.answerCallbackQuery(query.id);
            }

            if (query.data === 'preordina') {
                actions.push(query.from.id);

                try {
                    await bot.editMessageText(
                        BasicsFunction.customMessage(`<i>Scrivi il tuo nickname in-game...</i>`),
                        { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'HTML', reply_markup: Keyboards.getBackKeyboard() }
                    );
                    const employeeMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                    addPreorder(query.from.id, { employee: employeeMsg.text! });
                    await bot.deleteMessage(employeeMsg.chat.id, employeeMsg.message_id).catch(() => { });

                    await bot.editMessageText(
                        BasicsFunction.customMessage(`<i>Scrivi il nickname del cliente...</i>`),
                        { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'HTML', reply_markup: Keyboards.getBackKeyboard() }
                    );
                    const clientMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                    addPreorder(query.from.id, { client: clientMsg.text! });
                    await bot.deleteMessage(clientMsg.chat.id, clientMsg.message_id).catch(() => { });

                    await bot.editMessageText(
                        BasicsFunction.customMessage(`<i>Scrivi il veicolo preordinato...</i>`),
                        { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'HTML', reply_markup: Keyboards.getBackKeyboard() }
                    );
                    const vehicleMsg = await waitUserMessage(query.from.id, query.message.chat.id);
                    addPreorder(query.from.id, { vehicle: vehicleMsg.text! });
                    await bot.deleteMessage(vehicleMsg.chat.id, vehicleMsg.message_id).catch(() => { });

                    const preorder = getPreorder(query.from.id);
                    if (!preorder) throw new Error("❌ Errore nel modulo preordine.");

                    const text = `<b>Modulo Preordine Complementato!</b>\n\n` +
                        `👤 Tuo Nick: <b>${preorder.employee}</b>\n` +
                        `👤 Cliente: <b>${preorder.client}</b>\n` +
                        `🚗 Veicolo: <b>${preorder.vehicle}</b>\n\n` +
                        `Continuare?`;

                    await bot.editMessageText(text, {
                        chat_id: query.message.chat.id,
                        message_id: query.message.message_id,
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "🚫 Annulla", callback_data: "preordine_annulla" },
                                    { text: "✅ Continua", callback_data: "preordine_conferma" }
                                ]
                            ]
                        }
                    });
                } catch (err: any) {
                    removeAction(query.from.id);
                    removePreorder(query.from.id);
                    await bot.editMessageText(
                        `<i>❌ Modulo preordine annullato: ${err.message}</i>`,
                        { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: "HTML" }
                    );
                }
            }

            if (query.data === "preordine_annulla") {
                removePreorder(query.from.id);
                removeAction(query.from.id);
                await BasicsFunction.editStartMessage(bot, query);
            }

            if (query.data === "preordine_conferma") {
                const preorder = getPreorder(query.from.id);
                if (!preorder) return;

                const preorderId = await preorderRepo.createPreorder(preorder.employee!, preorder.client!, preorder.vehicle!);

                removePreorder(query.from.id);
                removeAction(query.from.id);

                await bot.sendMessage(Number(process.env.ADMIN_ID!),
                    `<b>📦 Nuovo Preordine!</b>\n\n` +
                    `Cliente: <b>${preorder.client}</b>\n` +
                    `Veicolo: <b>${preorder.vehicle}</b>\n` +
                    `Dipendente: <b>${preorder.employee}</b>\n` +
                    `N°: <b>${preorderId}</b>`,
                    {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [[
                                { text: "✅ Preordinato", callback_data: `preordine_approve_${preorderId}` },
                                { text: "🚫 Annulla", callback_data: `preordine_reject_${preorderId}` }
                            ]]
                        }
                    }
                );

                await bot.editMessageText("✅ Preordine inviato alla direzione!", {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id
                });
            }

            if (query.data?.startsWith("preordine_approve_") || query.data?.startsWith("preordine_reject_")) {
                const action = query.data.startsWith("preordine_approve_") ? "approve" : "reject";
                const id = Number(query.data.split("_")[2]);
                if (isNaN(id)) return;

                const preorder = await preorderRepo.getPreorderById(id);
                if (!preorder) return await bot.answerCallbackQuery(query.id, { text: "❌ Preordine non trovato!", show_alert: true });

                const employeeData = await employees.getEmployeeByNickname(preorder.employee_nickname);

                if (action === "approve") {
                    await preorderRepo.confirmPreorder(id);
                } else {
                    await preorderRepo.cancelPreorder(id);
                }

                await bot.editMessageReplyMarkup(
                    { inline_keyboard: [[{ text: action === "approve" ? "✅ Preordinato" : "❌ Rifiutato", callback_data: "done" }]] },
                    { chat_id: query.message.chat.id, message_id: query.message.message_id }
                );

                if (employeeData?.telegram_id) {
                    await bot.sendMessage(
                        Number(employeeData.telegram_id),
                        action === "approve"
                            ? `✅ Il tuo preordine n°${id} è stato approvato dalla direzione!`
                            : `❌ Il tuo preordine n°${id} è stato rifiutato dalla direzione!`,
                        { parse_mode: "HTML" }
                    );
                }

                await bot.sendMessage(
                    Number(process.env.ADMIN_ID!),
                    `👤 <b>${query.from.first_name}</b> ha ${action === "approve" ? "approvato" : "rifiutato"} il preordine n°${id}.`,
                    { parse_mode: "HTML" }
                );

                await bot.answerCallbackQuery(query.id, { text: `✅ Preordine ${action === "approve" ? "approvato" : "rifiutato"}` });
            }
        });
    }
}
