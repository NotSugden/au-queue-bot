import { Intents, ClientOptions } from 'discord.js';
import { ConnectionConfig } from 'mysql';

export const clientOptions: ClientOptions = {
  allowedMentions: { parse: [] },
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES
  ]
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./config.json') as ClientConfig;

export default config;

export interface ClientConfig {
  database: ConnectionConfig;
  token: string;
}