import { REST } from '@discordjs/rest';
import {
  ApplicationCommandOptionType,
  RESTPutAPIApplicationCommandsJSONBody as JSONBody,
  RESTPutAPIApplicationCommandsResult as JSONResponse,
  Routes
} from 'discord-api-types/v9';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const token = require('./config.json').token;

const applicationId = Buffer.from(token.split('.')[0], 'base64').toString();

const rest = new REST({ version: '9' }).setToken(token);

// const buildSettingsSubCommand = (
//   name: string, displayName: string,
//   type: ApplicationCommandOptionType, displayType: string = displayName
// ): APIApplicationCommandOption => ({
//   description: `Get or change the ${displayName}.`,
//   name,
//   type: ApplicationCommandOptionType.SubcommandGroup,
//   options: [{
//     description: `Get the ${displayName}.`,
//     name: 'get',
//     type: ApplicationCommandOptionType.Subcommand
//   }, {
//     description: `Change the ${displayName}.`,
//     name: 'change',
//     type: ApplicationCommandOptionType.Subcommand,
//     options: [{
//       description: `The ${displayType}.`,
//       name: 'value',
//       type,
//       required: true
//     }]
//   }]
// });

// const commands: JSONBody = [{
//   description: 'Change settings for the queue bot.',
//   name: 'settings',
//   options: [
//     buildSettingsSubCommand(
//       'category', 'Among Us Category',
//       ApplicationCommandOptionType.Channel
//     ),
//     buildSettingsSubCommand(
//       'waiting-room', 'Waiting Room Channel',
//       ApplicationCommandOptionType.Channel
//     )
//   ]
// }];

const upperFirst = (string: string) => string[0].toUpperCase() + string.slice(1).toLowerCase();

const allSettings = ['category', 'waiting-room'].map(val => ({
  name: val.split('-').map(upperFirst).join(' '),
  value: val
}));

const buildChoiceOption = (descPart: 'find' | 'change') => ({
  description: `The setting to ${descPart}.`,
  name: 'setting',
  type: ApplicationCommandOptionType.String,
  choices: allSettings,
  required: true
});

const commands: JSONBody = [{
  description: 'Change settings for the queue bot.',
  name: 'settings',
  options: [{
    description: 'Get a setting',
    name: 'get',
    type: ApplicationCommandOptionType.Subcommand,
    options: [buildChoiceOption('find')]
  }, {
    description: 'Change a setting',
    name: 'change',
    type: ApplicationCommandOptionType.Subcommand,
    options: [buildChoiceOption('change')]
  }]
}];

(async() => {
  const resultA = await rest.put(Routes.applicationCommands(applicationId), {
    body: commands
  }) as JSONResponse;
  console.log('PUT commands:', resultA);
})().catch(console.error);
