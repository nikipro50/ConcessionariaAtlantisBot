export default async function createLimitedInvite(chatId: number | string, memberLimit: number): Promise<string> {
    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN!}/createChatInviteLink`;

    const body = {
        chat_id: chatId,
        member_limit: memberLimit
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!json.ok) {
        throw new Error(`Errore Telegram API: ${JSON.stringify(json)}`);
    }

    return json.result.invite_link;
}