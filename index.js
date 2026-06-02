const axios = require('axios');
const express = require('express');
const crypto = require('crypto');

// Configuration
const BOT_TOKEN = '8627509525:AAESth4wK45uHcaDK49oNgCwFNPSfd5vCf8';
const CHAT_ID = '-1004297132684';
const CHECK_INTERVAL = 7000;
const CREATOR = '@K1XTREME';

// State
let lastMessages = new Set();
let messageCount = 0;
let startTime = Date.now();

// FRESH COOKIES FROM YOUR LAST REQUEST (June 2, 2026)
let COOKIES = {
    "XSRF-TOKEN": "eyJpdiI6IjhtNGtXaHZHZEp0dEtNL1NPZkEydFE9PSIsInZhbHVlIjoib2ZORWY1TWpwd1doQjNDT2VUeCtLY1FTSGZRdVlyS0pJZ0plN0tjTU5sZkhOckovNGc2M3ZzSXA3dHRSYzB0cnZmczdJNjZrUFZkbzBYeVRvUDk3VDI5UlkzdUJ5YzIrazNKaWhwc0ZXaWhnL1crOTU4SzJ5aGJ2WExtMk9jT08iLCJtYWMiOiI1N2UyNWVlNDRiZDc1MmZhNzE5OWIxMGY1ZjMwMzZkYzMxZWM5M2RjN2JmYzdkMGFkYTU0YTJlNGZmYTUzNmM1IiwidGFnIjoiIn0%3D",
    "ivas_sms_session": "eyJpdiI6ImdpZ3gzV3NtWEhjdHh1SW4yWXQ5OUE9PSIsInZhbHVlIjoiQjBpaHRadFhwc3hrNUtwTnhCMEk2WEdJaWZ4OStsd0xNdmVRK2twUTZ2QzZ3YlZoQUhJeXF3eHMzTzZOVS85SE9XYWsrRDI5Ykx6UWRYWDB2ek1sZlZrZkg5eUU2MW95VmEvMExjaWxSejM1UldLMUgrcFQ3SDhObS9BbUxaL00iLCJtYWMiOiI0MTBhN2IxNjhmMjFkNzMxZDI1MmM1NjkwNmNmNDg4MjUxMWU4Y2NiNDU1NDdmMjdjNjM5NDYwYzBmNDNjMzQ1IiwidGFnIjoiIn0%3D",
    "cf_clearance": "3pMgU8wgEe_uySzEL30GTApKpC2BIztcdYSJnkFI0HA-1780383599-1.2.1.1-jt8QxWQTpgOvhVnQ3ekkyOdI1PbUryUeL5CaquZCqzeu2.uK9V0E.a4yirXddfc1jvF6qXQz9eva1M.31ldu0sQtB25LLFUiZGZhMgQja7SpEoLt6QFtomIyChT9UGk3h1I_nWf1Q_8eTF8ct8CHY2I1g7Zl50FevNNUZ8qIljEubnfM3aZcxD5iqs.xzoLMsYqEx8M.SR9PQoVlqys57m2ac__9uNnfY8AfB83mL2B6mWC4aWqjB8W4sqmKcV75azWsUst.vofE0gq1PUACUnPC7b5YB05nGbKHbDbLh5PENExrWrM9vPjt.Le3p3yAdZ9IE4EbOM_PfbY1sDM0_cyq1bzCS9OP2wiJX2oh86NWbdKEfpCdG5DD.CNvEfnHAaBiCq.eblVMQHHQp870zCJrOZUVOotRrJaoUABvIRc"
};

const log = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.log(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`)
};

const client = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

function updateCookieHeader() {
    const cookieString = Object.entries(COOKIES)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    if (cookieString) {
        client.defaults.headers['Cookie'] = cookieString;
        log.success('Cookies loaded');
    }
}
updateCookieHeader();

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractOTP(message) {
    const patterns = [/\b(\d{4,8})\b/, /code[:\s]*(\d{4,8})/i, /otp[:\s]*(\d{4,8})/i];
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) return match[1];
    }
    return 'N/A';
}

function maskNumber(number) {
    const clean = number.replace(/\D/g, '');
    if (clean.length >= 10) return `+${clean.slice(0, 4)}****${clean.slice(-4)}`;
    return number;
}

function detectService(message, sender) {
    const combined = (message + ' ' + sender).toLowerCase();
    if (combined.includes('telegram')) return { icon: '🔵', name: 'Telegram' };
    if (combined.includes('whatsapp')) return { icon: '🟢', name: 'WhatsApp' };
    if (combined.includes('imo')) return { icon: '💬', name: 'IMO' };
    if (combined.includes('facebook')) return { icon: '📘', name: 'Facebook' };
    return { icon: '📨', name: 'SMS' };
}

function getCountryFlag(number) {
    const clean = number.replace(/\D/g, '');
    if (clean.startsWith('263')) return '🇿🇼';
    if (clean.startsWith('58')) return '🇻🇪';
    if (clean.startsWith('7')) return '🇰🇿';
    if (clean.startsWith('225')) return '🇨🇮';
    if (clean.startsWith('237')) return '🇨🇲';
    return '📱';
}

function generateHash(sms) {
    const unique = `${sms.datetime}|${sms.number}|${sms.sender}|${sms.message.slice(0, 50)}`;
    return crypto.createHash('md5').update(unique).digest('hex');
}

function formatSMS(sms) {
    const flag = getCountryFlag(sms.number);
    const { icon, name } = detectService(sms.message, sms.sender);
    const otp = extractOTP(sms.message);
    const masked = maskNumber(sms.number);
    const safeMsg = escapeHtml(sms.message.slice(0, 500));
    
    return `<b>${flag} New ${name} OTP!</b>\n\n` +
        `🕰 <b>Time:</b> ${sms.datetime}\n` +
        `📞 <b>Number:</b> ${masked}\n` +
        `${icon} <b>Service:</b> ${name}\n` +
        `🔑 <b>OTP:</b> <code>${otp}</code>\n\n` +
        `📩 <b>Message:</b>\n` +
        `<code>${safeMsg}</code>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>All credits goes to ${CREATOR} 🗿</i>`;
}

async function sendTelegramMessage(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
        messageCount++;
        return true;
    } catch (error) {
        log.error(`Telegram error: ${error.message}`);
        return false;
    }
}

async function getToken() {
    try {
        const response = await client.get('https://www.ivasms.com/portal');
        const match = response.data.match(/<meta name="csrf-token" content="([^"]+)"/);
        if (match) {
            log.success(`Token obtained: ${match[1].substring(0, 20)}...`);
            return match[1];
        }
        return null;
    } catch (error) {
        if (error.response?.status === 403) log.error('Cloudflare blocking - cookies may be expired');
        return null;
    }
}

async function fetchSMS(token) {
    const today = new Date().toISOString().slice(0, 10);
    
    try {
        const rangesResp = await client.post('https://www.ivasms.com/portal/sms/received/getsms',
            new URLSearchParams({ from: today, to: today, _token: token }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-TOKEN': token } }
        );
        
        const ranges = [...rangesResp.data.matchAll(/toggleRange\('([^']+)'/g)].map(m => m[1]);
        if (!ranges.length) return [];
        
        log.info(`Found ranges: ${ranges.join(', ')}`);
        
        const allSMS = [];
        
        for (const range of ranges) {
            const numbersResp = await client.post('https://www.ivasms.com/portal/sms/received/getsms/number',
                new URLSearchParams({ _token: token, start: today, end: today, range }).toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-TOKEN': token } }
            );
            
            const numbers = [...numbersResp.data.matchAll(/toggleNum[^(]+\('(\d+)'/g)].map(m => m[1]);
            log.info(`Range ${range}: ${numbers.length} numbers`);
            
            for (const number of numbers) {
                const smsResp = await client.post('https://www.ivasms.com/portal/sms/received/getsms/number/sms',
                    new URLSearchParams({ _token: token, start: today, end: today, Number: number, Range: range }).toString(),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-TOKEN': token } }
                );
                
                const rows = smsResp.data.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
                
                for (const row of rows) {
                    if (row.includes('<th')) continue;
                    
                    const senderMatch = row.match(/class="cli-tag"[^>]*>([^<]+)</);
                    const sender = senderMatch ? senderMatch[1].trim() : 'SMS';
                    
                    const msgMatch = row.match(/class="msg-text"[^>]*>([\s\S]*?)<\/div>/i);
                    let message = '';
                    if (msgMatch) {
                        message = msgMatch[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
                    }
                    
                    const timeMatch = row.match(/class="time-cell"[^>]*>\s*([0-9:]+)\s*</);
                    const time = timeMatch ? timeMatch[1].trim() : new Date().toLocaleTimeString();
                    
                    if (message && message.length > 2) {
                        allSMS.push({ datetime: `${today} ${time}`, number, sender, message });
                    }
                }
                await new Promise(r => setTimeout(r, 300));
            }
        }
        return allSMS;
    } catch (error) {
        log.error(`Fetch SMS failed: ${error.message}`);
        return [];
    }
}

async function processNewSMS(smsList) {
    if (!smsList.length) return 0;
    
    const newMessages = [];
    for (const sms of smsList) {
        const hash = generateHash(sms);
        if (!lastMessages.has(hash)) {
            newMessages.push(sms);
            lastMessages.add(hash);
            if (lastMessages.size > 5000) {
                const toDelete = [...lastMessages].slice(0, 2500);
                toDelete.forEach(h => lastMessages.delete(h));
            }
        }
    }
    
    if (!newMessages.length) return 0;
    
    let sent = 0;
    for (const sms of newMessages) {
        if (await sendTelegramMessage(formatSMS(sms))) {
            sent++;
            await new Promise(r => setTimeout(r, 500));
        }
    }
    if (sent > 0) log.info(`📨 Sent ${sent} new messages`);
    return sent;
}

// Express web interface
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>IVA SMS Monitor</title></head>
        <body style="font-family: Arial; padding: 20px;">
            <h1>🤖 IVA SMS Monitor Bot</h1>
            <p>Status: <b style="color:green">RUNNING ✅</b></p>
            <p>Messages Sent: <b>${messageCount}</b></p>
            <p>Uptime: <b>${Math.floor((Date.now() - startTime) / 1000)} seconds</b></p>
            <hr>
            <p>Bot is monitoring for OTP messages every 7 seconds.</p>
            <p>Creator: <b>${CREATOR}</b></p>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'alive',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        messages: messageCount,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => log.info(`Web server on port ${PORT}`));

// Main function
async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('  🔥 IVA SMS MONITOR - PROFESSIONAL EDITION 🔥');
    console.log(`  👑 Created by ${CREATOR}`);
    console.log(`  ⏱️  Check Interval: 7 seconds`);
    console.log('═'.repeat(60) + '\n');
    
    log.info('Starting bot with pre-configured cookies...');
    
    const token = await getToken();
    if (!token) {
        log.error('Failed to get token with current cookies');
        await sendTelegramMessage(`<b>❌ Authentication Failed</b>\n\nCookies may have expired. Please get fresh cookies from your browser.\n\n━━━━━━━━━━━━━━━━━━━━━━\n<i>All credits goes to ${CREATOR} 🗿</i>`);
        return;
    }
    
    await sendTelegramMessage(`<b>✅ IVA SMS Monitor Active</b>\n\n` +
        `• Session: Active\n` +
        `• Check Interval: 7s\n` +
        `• Monitoring for new messages...\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>All credits goes to ${CREATOR} 🗿</i>`);
    
    log.success('Bot started successfully!');
    
    let lastStats = Date.now();
    
    while (true) {
        try {
            const smsList = await fetchSMS(token);
            await processNewSMS(smsList);
            
            if (Date.now() - lastStats > 600000) {
                const uptime = Math.floor((Date.now() - startTime) / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                await sendTelegramMessage(`<b>📊 Bot Statistics</b>\n\n` +
                    `• Uptime: ${hours}h ${minutes}m\n` +
                    `• Messages Sent: ${messageCount}\n` +
                    `• Status: ✅ Active\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `<i>All credits goes to ${CREATOR} 🗿</i>`);
                lastStats = Date.now();
            }
            
            await new Promise(r => setTimeout(r, CHECK_INTERVAL));
        } catch (error) {
            log.error(`Loop error: ${error.message}`);
            await new Promise(r => setTimeout(r, CHECK_INTERVAL));
        }
    }
}

main().catch(console.error);
