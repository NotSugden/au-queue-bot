import { Awaited, ButtonInteraction, CommandInteraction, Interaction } from 'discord.js';
import Util from '../Util';
import { promises as fs } from 'fs';

type InteractionHandler = (interaction: Interaction) => Awaited<void>;
interface InteractionModule {
  default: InteractionHandler;
}
const interactionHandlers = new Map<string, InteractionModule>();

fs.readdir('./interactionHandlers').then(async files => {
  for (const fileName of files) {
    const mod = (await import(`../interactionHandlers/${fileName}`)) as InteractionModule;

    interactionHandlers.set(fileName.slice(0, -3), mod);
  }
});

export default async (interaction: Interaction) => {
  let id: `${'command' | 'button' | 'select' | 'context'}_${string}` | null = null;
  if (interaction.isCommand()) {
    id = `command_${interaction.commandName}`;
  } else if (interaction.isButton()) {
    id = `button_${interaction.customId}`;
  } else if (interaction.isSelectMenu()) {
    id = `select_${interaction.customId}`;
  } else if (interaction.isContextMenu()) {
    id = `context_${interaction.commandName}`;
  }

  const handler = id && interactionHandlers.get(id);

  try {
    await handler?.default(interaction);
  } catch (error) {
    console.error(error);
    await Util.reply(
      interaction as CommandInteraction | ButtonInteraction,
      { content: 'An Unknown Error has occoured', components: [] }
    );
  }
};