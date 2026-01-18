import TelegramBot from "node-telegram-bot-api";
import dotenv from 'dotenv';
import BaseDatabase from "./database/Database";
import StartCommand from "./commands/StartCommand";
import NewCallback from "./events/NewCallback";
import GerarchiaComamnd from "./commands/GerarchiaCommand";
import PexCommand from "./commands/PexCommand";
import DepexCommand from "./commands/DepexCommand";
import PexRACommand from "./commands/PexRACommand";
import DepexRACommand from "./commands/DepexRACommand";
import CongediAttiviCommand from "./commands/CongediAttiviCommand";
import CongedoListaCommand from "./commands/CongedoListaCommand";
import ListaCongediDipendenteCommand from "./commands/ListaCongediDipendenteCommand";
import GestisciCongedoCommand from "./commands/GestisciCongedoCommand";

dotenv.config();
console.clear();

if (!process.env.BOT_TOKEN)
    throw new Error("Insert BOT_TOKEN in .env file!");

const bot: TelegramBot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

(async () => {
    await BaseDatabase.init();

    // commands
    new StartCommand(bot);
    new GerarchiaComamnd(bot);
    new PexCommand(bot);
    new DepexCommand(bot);
    new PexRACommand(bot);
    new DepexRACommand(bot);
    new CongediAttiviCommand(bot);
    new CongedoListaCommand(bot);
    new ListaCongediDipendenteCommand(bot);
    new GestisciCongedoCommand(bot);

    // events
    new NewCallback(bot);

    bot.on('polling_error', (err) => console.error(err));
    console.log("Bot avviato con successo!");
})();
