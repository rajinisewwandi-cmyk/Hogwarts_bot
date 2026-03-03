const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const readline = require("readline");
const app = express();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// Render Web Server
const PORT = process.env.PORT || 3000;
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
        printQRInTerminal: false, // QR ඕනේ නැහැ දැන්
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- 🔑 PAIRING CODE LOGIC ---
    if (!conn.authState.creds.registered) {
        console.log("-----------------------------------------");
        const phoneNumber = await question('ENTER YOUR WHATSAPP NUMBER (e.g. 947xxxxxxxx): ');
        const code = await conn.requestPairingCode(phoneNumber.trim());
        console.log(`\n👉 YOUR PAIRING CODE: ${code}\n`);
        console.log("-----------------------------------------");
    }

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log("✅ HOGWARTS COUNCIL ONLINE!");
        if (u.connection === 'close') startBot();
    });
}
startBot();
