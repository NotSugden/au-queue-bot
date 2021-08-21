import { ButtonInteraction } from 'discord.js';
import { QueueManager } from '../QueueManager';
import Util from '../Util';

export default async (interaction: ButtonInteraction) => {
  const guild = interaction.guild!;

  const manager = QueueManager.get(guild);

  if (manager.shouldDisablePing) {
    await interaction.reply({
      content: 'Queue pinging is still disabled',
      ephemeral: true
    });
    return;
  }

  await interaction.update({
    components: Util.buildPingRow(manager.shouldDisablePing = true),
    fetchReply: false
  });

  const message = await interaction.followUp({
    content: [
      `Queue Ping by ${interaction.user}:`, '',
      ...manager.queue
    ].join('\n'),
    allowedMentions: {
      users: manager.queue.map(({ id }) => id)
    }
  });

  manager.pingTimeout = setTimeout(() => {
    manager.pingTimeout = null;
    manager.message?.edit({
      components: Util.buildPingRow(manager.shouldDisablePing = false)
    }).catch(console.error);
    interaction.channel?.messages.delete(message.id)
      .catch(console.error);
  }, 60_000 * 10);
};