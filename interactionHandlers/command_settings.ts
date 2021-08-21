import { Constants, CommandInteraction, MessageSelectOptionData, Permissions, SelectMenuInteraction, MessageActionRowOptions } from 'discord.js';
import Database, { ConfigSettings } from '../Database';
import Util from '../Util';

const EMOJI_MAP = {
  GUILD_CATEGORY: '878487055695491082',
  GUILD_VOICE: '878487035776737380'
} as const;

const handleChannelChange = (setting: ConfigSettings, displayName: string, type: keyof typeof EMOJI_MAP) =>
  async (interaction: CommandInteraction, get: boolean) => {
    const existingChannelId = await Database.fetchSetting(setting, interaction.guildId!);
    const existingChannel = existingChannelId && interaction.guild!.channels.cache.get(existingChannelId);
    if (get) {
      await interaction.reply(
        existingChannel ? `The ${displayName} is ${existingChannel}.` : `There is no ${displayName} set.` 
      );
    } else {
      const choices: MessageSelectOptionData[] = [];
      const emoji = EMOJI_MAP[type];
      for (const channel of interaction.guild!.channels.cache.values()) {
        if (channel.type === type) {
          const length = choices.push({
            label: channel.name,
            value: channel.id,
            default: false,
            emoji
          });
          if (length > 25) break;
        }
      }

      const componentRow: MessageActionRowOptions = {
        components: [{
          customId: `settings-${setting}`,
          maxValues: 1,
          minValues: 1,
          options: choices,
          type: Constants.MessageComponentTypes.SELECT_MENU
        }],
        type: Constants.MessageComponentTypes.ACTION_ROW
      };

      const response = await interaction.reply({
        content: 'Please choose a channel from the list',
        components: [componentRow],
        fetchReply: true
      });

      try {
        const selectResponse = await Util.awaitInteraction<SelectMenuInteraction>(interaction, response);
        await Util.disableComponents(interaction, componentRow);
        const newChannel = interaction.guild!.channels.cache.get(selectResponse.values[0])!;

        if (newChannel.type !== type) {
          await selectResponse.reply({
            content: `You must provide a ${type.split('_').pop()!.toLowerCase()} channel.`,
            ephemeral: true
          });
          return;
        }

        await Database.changeSetting(setting, interaction.guildId!, newChannel.id);

        await selectResponse.reply(`Set the new ${displayName} to ${newChannel}.`);
      } catch (error) {
        await Util.disableComponents(interaction, componentRow);
        if (error instanceof Map) {
          await interaction.followUp({
            content: 'There was no response in time, please try again.',
            ephemeral: true
          });
        } else throw error;
      }
    }
  };

const handlers = {
  'category': handleChannelChange(ConfigSettings.AmongUsCategoryId, 'Among Us Category', 'GUILD_CATEGORY'),
  'waiting-room': handleChannelChange(ConfigSettings.QueueChannelId, 'Waiting Room', 'GUILD_VOICE')
} as const;

export default async (interaction: CommandInteraction) => {
  if (!interaction.guild) {
    await interaction.reply('This command is only valid in guilds');
    return;
  }

  const permissions = interaction.member!.permissions;
  if (!(typeof permissions === 'string' ? new Permissions(BigInt(permissions)) : permissions)
    .has(Permissions.FLAGS.ADMINISTRATOR)
  ) {
    await interaction.reply({
      ephemeral: true,
      content: 'You don\'t have permissions to use this command.'
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand(true);
  const settingId = interaction.options.getString('setting', true) as keyof typeof handlers;

  await handlers[settingId](interaction, subcommand === 'get');
};