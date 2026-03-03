const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();

// --- ඔයාගේ නම්බර් එක මෙතනට ඇතුළත් කළා ---
const myNumber = "94765821687"; 

// Render Web Server Setup
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("Hogwarts Council Pairing System Active! 🪄"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- AUTOMATIC PAIRING CODE GENERATOR ---
    if (!conn.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 8000)); // Build එක ස්ථාවර වෙනකම් තත්පර 8ක් ඉන්නවා
        try {
            const code = await conn.requestPairingCode(myNumber.trim());
            console.log("\n=========================================");
            console.log(`👉 YOUR WHATSAPP PAIRING CODE: ${code}`);
            console.log("=========================================\n");
        } catch (error) {
            console.log("Error requesting pairing code: ", error);
        }
    }

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('connection.update', (u) => {
        const { connection } = u;
        if (connection === 'open') console.log("✅ HOGWARTS COUNCIL ONLINE!");
        if (connection === 'close') startBot();
    });

    // පොඩි මෙනු එකක් (පරීක්ෂා කිරීමට)
    conn.ev.on('messages.upsert', async (m) => {
        const mek = m.messages[0];
        if (!mek.message || mek.key.fromMe) return;
        const from = mek.key.remoteJid;
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";

        if (body.toLowerCase() === '.menu') {
            await conn.sendMessage(from, { text: "✨ *HOGWARTS COUNCIL* ✨\n\nStatus: Online 🪄\nOwner: Rashmika" });
        }
    });
}
startBot();
