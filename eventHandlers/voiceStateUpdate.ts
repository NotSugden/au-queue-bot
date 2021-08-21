import { CategoryChannel, MessageEmbed, Permissions, TextChannel, VoiceState } from 'discord.js';
import Database, { ConfigSettings } from '../Database';
import { QueueManager } from '../QueueManager';
import Util from '../Util';

export default async (oldState: VoiceState, newState: VoiceState) => {
  const { guild } = newState;

  const queueChannelId = await Database.fetchSetting(ConfigSettings.QueueChannelId, guild.id);
  const newIsQueue = newState.channelId === queueChannelId;
  const manager = QueueManager.get(guild);

  const user = await guild.client.users.fetch(newState.id);

  let queueUpdated = false;

  if (newIsQueue) {
    manager.add(user);
    queueUpdated = true;
  } else if (oldState.channelId === queueChannelId && !newIsQueue) {
    manager.remove(user);
    queueUpdated = true;
  }

  if (!queueUpdated) return;
  if (manager.message) {
    await manager.message.delete()
      .catch(console.error);
  }

  const categoryId = await Database.fetchSetting(ConfigSettings.AmongUsCategoryId, guild.id);
  const category = categoryId && (guild.channels.cache.get(categoryId) as CategoryChannel | undefined);

  if (!category) return;

  let channel = category.children.find<TextChannel>((ch): ch is TextChannel => ch.name === 'queue' && ch.type === 'GUILD_TEXT');

  const me = guild.me ?? await guild.members.fetch(guild.client.user!);
      
  if (!channel) {
    const permissions = category.permissionsFor(me);
    if (!permissions.has(Permissions.FLAGS.MANAGE_CHANNELS))
      return;
        
    channel = await guild.channels.create('queue', {
      reason: 'Queue Channel',
      type: 'GUILD_TEXT',
      topic: 'Queue Channel',
      parent: category
    });
  }

  const permissions = channel.permissionsFor(me);
  if (!permissions.has(Permissions.FLAGS.SEND_MESSAGES))
    return;
      
  manager.message = await channel.send({
    embeds: [new MessageEmbed()
      .setDescription([
        'Queue:', '',
        ...manager.queue.map((user, idx) => `\`${idx+1}.\` ${user} (${user.username})`)
      ].join('\n'))
    ],
    components: Util.buildPingRow(manager.shouldDisablePing)
  });
};