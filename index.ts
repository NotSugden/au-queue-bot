import { Awaited, Client } from 'discord.js';
import ClientConfig, { clientOptions } from './ClientConfig';
import { promises as fs } from 'fs';
import Util from './Util';
import Database from './Database';

const client = Util.client = new Client(clientOptions);

client.login(ClientConfig.token);

client.once('ready', () => {
  console.log('Logged in!');
  Database.connect()
    .catch(error => client.emit('error', error));
});

client.on('error', console.error);

fs.readdir('./eventHandlers').then(async files => {
  for (const fileName of files) {
    const mod = (await import(`./eventHandlers/${fileName}`)).default as (...args: unknown[]) => Awaited<void>;

    client.on(fileName.slice(0, -3), mod);
  }
});