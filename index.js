const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();

// --- 🌐 RENDER WEB SERVER (24/7 සඳහා) ---
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Hogwarts Council is Active! 🪄"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // Render Logs වල QR එක මෙතනින් බලාගන්න
        logger: pino({ level: "silent" }),
        browser: ["Hogwarts Bot", "Safari", "3.0"]
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') {
            console.log("✅ HOGWARTS COUNCIL ONLINE!");
        }
        if (connection === 'close') {
            console.log("🔄 Connection lost, restarting...");
            startBot();
        }
    });

    conn.ev.on('messages.upsert', async (m) => {
        const mek = m.messages[0];
        if (!mek.message || mek.key.fromMe) return;

        const from = mek.key.remoteJid;
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
        const prefix = ".";

        if (body.startsWith(prefix)) {
            const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

            if (command === 'menu') {
                const menuText = `✨ *HOGWARTS POTTERHEADS* ✨\n\n` +
                                 `🏰 *Council System:* Active\n` +
                                 `⚡ *Prefix:* [ ${prefix} ]\n` +
                                 `👤 *Owner:* Rashmika Shashadara\n\n` +
                                 `🪄 *Available Commands:*\n` +
                                 `> .sticker (Reply to image)\n` +
                                 `> .alive\n` +
                                 `> .song (Coming soon)\n\n` +
                                 `🛡️ _Property of Hogwarts Council_`;
                
                await conn.sendMessage(from, { text: menuText });
            }

            if (command === 'alive') {
                await conn.sendMessage(from, { text: "I'm still breathing, Captain! 🪄⚡" });
            }
        }
    });
}

startBot();
