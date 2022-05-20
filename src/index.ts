import 'dotenv/config';
import DirectoraClient from './structures/DirectoraClient';

const client = new DirectoraClient(process.env.DISCORD_TOKEN as string, {
    intents: ['guilds', 'guildMembers', 'guildBans', 'guildIntegrations', 'guildWebhooks', 'guildVoiceStates', 'guildMessages', 'guildMessageReactions'],
    allowedMentions: {
        everyone: false,
        roles: false,
        users: true,
        repliedUser: true,
    },
    restMode: true,
    rest: {
        baseURL: '/api/v10'
    },
    messageLimit: 100,
});

client.init();