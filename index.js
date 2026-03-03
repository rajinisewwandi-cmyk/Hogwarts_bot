const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();

const myNumber = "94765821687"; 

// Render Web Server
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("Hogwarts Council Advanced System! 🏰"));
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
        browser: ["Hogwarts Bot", "Safari", "3.0"]
    });

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log("✅ HOGWARTS COUNCIL ONLINE!");
        if (u.connection === 'close') startBot();
    });

    conn.ev.on('messages.upsert', async (m) => {
        const mek = m.messages[0];
        if (!mek.message || mek.key.fromMe) return;

        const from = mek.key.remoteJid;
        const type = Object.keys(mek.message)[0];
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
        const prefix = ".";
        const isGroup = from.endsWith('@g.us');

        if (body.startsWith(prefix)) {
            const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
            const args = body.trim().split(/ +/).slice(1);

            // --- 📢 MENTION ALL (TAG ALL) ---
            if (command === 'tagall' || command === 'hidetag') {
                if (!isGroup) return;
                const groupMetadata = await conn.groupMetadata(from);
                const participants = groupMetadata.participants;
                let text = args.length > 0 ? `📢 *Message:* ${args.join(' ')}\n\n` : `📢 *Attention Everyone!*\n\n`;
                for (let mem of participants) {
                    text += `⚡ @${mem.id.split('@')[0]}\n`;
                }
                await conn.sendMessage(from, { text: text, mentions: participants.map(a => a.id) });
            }

            // --- 🚫 KICK (Reply to a message) ---
            if (command === 'kick') {
                if (!isGroup) return;
                const quoted = mek.message.extendedTextMessage?.contextInfo?.participant;
                if (!quoted) return await conn.sendMessage(from, { text: "Please reply to the user you want to kick! 🪄" });
                await conn.groupParticipantsUpdate(from, [quoted], "remove");
                await conn.sendMessage(from, { text: "User has been banished from Hogwarts! 🪄🚫" });
            }

            // --- ❄️ FREEZE (Group Settings) ---
            if (command === 'freeze' || command === 'mute') {
                if (!isGroup) return;
                await conn.groupSettingUpdate(from, 'announcement');
                await conn.sendMessage(from, { text: "Group is now *FROZEN*. Only Admins can talk! ❄️🛡️" });
            }

            // --- 🔥 UNFREEZE (Group Settings) ---
            if (command === 'unfreeze' || command === 'unmute') {
                if (!isGroup) return;
                await conn.groupSettingUpdate(from, 'not_announcement');
                await conn.sendMessage(from, { text: "Group is now *UNFROZEN*. Everyone can talk! 🔥🔓" });
            }

            // --- 🏰 MENU ---
            if (command === 'menu') {
                let menuText = `🏰 *HOGWARTS ADMIN PANEL* 🏰\n\n` +
                               `*Admin Commands:*\n` +
                               `🪄 .tagall - Mention everyone\n` +
                               `🪄 .kick - Remove user (Reply)\n` +
                               `🪄 .freeze - Only admins\n` +
                               `🪄 .unfreeze - Everyone can talk\n\n` +
                               `*Basic Commands:*\n` +
                               `🪄 .alive / .owner\n\n` +
                               `🛡️ _Hogwarts Council System_`;
                await conn.sendMessage(from, { text: menuText });
            }
        }
    });
}
startBot();
