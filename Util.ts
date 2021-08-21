import { APIMessage } from 'discord-api-types/payloads/v9';
import { ButtonInteraction, Client, CommandInteraction, Constants, DiscordAPIError, Interaction, InteractionCollector, Message, MessageActionRowOptions, MessageComponentInteraction, User, WebhookEditMessageOptions } from 'discord.js';

export default class Util extends null {
  public static client: Client;

  public static reply(interaction: CommandInteraction | ButtonInteraction, data: WebhookEditMessageOptions | string) {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(data);
    } else {
      if (typeof data === 'string') data = { content: data };
      return interaction.reply({ ...data, fetchReply: true });
    }
  }

  public static deferReply(interaction: CommandInteraction | ButtonInteraction) {
    if (!interaction.deferred) {
      if (interaction.isButton()) {
        return interaction.deferUpdate();
      } else if (interaction.isCommand()) {
        return interaction.deferReply();
      }
    }
    return Promise.resolve();
  }

  // Not an async function because `.catch` just looks a whole lot better
  public static tryMessage(user: User, ...args: Parameters<User['send']>) {
    return user.send(...args).catch(error => {
      if (error instanceof DiscordAPIError && error.code === Constants.APIErrors.CANNOT_MESSAGE_USER) {
        return null;
      }
      throw error;
    });
  }

  public static awaitInteraction<T extends Interaction = Interaction>(interaction: CommandInteraction, response: Message | APIMessage) {
    return new Promise<T>((resolve, reject) => {
      const collector = new InteractionCollector<T>(interaction.client, {
        message: response,
        componentType: Constants.MessageComponentTypes.SELECT_MENU,
        time: 15_000
      });
      collector.on('collect', async (collected) => {
        if (collected.user.id !== interaction.user.id) {
          // im pretty sure every interaction class has a reply method
          // so i really don't get why its not just on the `Interaction` class
          await (collected as unknown as MessageComponentInteraction).reply({
            content: 'This is not your command.',
            ephemeral: true
          });
          return;
        }
        resolve(collected);
        collector.stop('finito');
      });
      collector.on('end', (collected, reason) => {
        if (reason !== 'finito') reject(collected);
      });
    });
  }

  public static disableComponents(interaction: CommandInteraction, ...rows: MessageActionRowOptions[]) {
    for (const row of rows) for (const component of row.components) {
      component.disabled = true;
    }

    return interaction.editReply({
      components: rows
    });
  }

  public static buildPingRow(disabled: boolean): [MessageActionRowOptions] {
    return [{
      components: [{
        style: Constants.MessageButtonStyles.SECONDARY,
        customId: 'ping_queue',
        disabled,
        label: 'Ping Queue',
        type: Constants.MessageComponentTypes.BUTTON
      }],
      type: Constants.MessageComponentTypes.ACTION_ROW
    }];
  }
}