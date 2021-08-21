/* eslint-disable @typescript-eslint/no-var-requires */
const token = require('./compiled/config.json').token;
const id = Buffer.from(token.split('.')[0], 'base64').toString();
const fetch = require('node-fetch');

const headers = {
  Authorization: `Bot ${token}`,
  'Content-Type': 'application/json'
};

const route = (...path) => `https://discord.com/api/v8/${path.join('/')}`;

const getCommandsRoute = (guildId, ...extras) => {
  const array = guildId
    ? ['applications', id, 'guilds', guildId, 'commands']
    : ['applications', id, 'commands'];
  return route(...array, ...extras);
};

const createCommand = async (data, guildId) => {
  const response = await fetch(getCommandsRoute(guildId), {
    method: 'POST',
    headers,
    body: data
  });
  return response.json();
};

const getCommands = async guildId => {
  const response = await fetch(getCommandsRoute(guildId), {
    method: 'GET',
    headers
  });
  return response.json();
};

const deleteCommand = async (guildId, commandId) => {
  await fetch(getCommandsRoute(guildId, commandId), {
    method: 'DELETE',
    headers
  });
};

const getPermissions = async (guildId, commandId) => {
  const response = await fetch(getCommandsRoute(guildId, commandId, 'permissions'), {
    method: 'GET',
    headers
  });
  return response.json();
};

const getAllPermissions = async (guildId) => {
  const response = await fetch(getCommandsRoute(guildId, 'permissions'), {
    method: 'GET',
    headers
  });
  return response.json();
};

const editPermissions = async (guildId, commandId, roleId, value = true) => {
  const response = await fetch(getCommandsRoute(guildId, commandId, 'permissions'), {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      permissions: [{
        id: roleId,
        type: 1,
        permission: value
      }]
    })
  });
  return response.json();
};

const log = data =>
  console.log(require('util').inspect(data, { depth: 100 }));

const json = process.argv[2];
const guildId = process.argv[3];

if (json === 'get_commands') {
  getCommands(guildId).then(log);
} else if (json === 'delete_command') {
  deleteCommand(guildId, process.argv[4]);
} else if (json === 'get_all_permissions') {
  getAllPermissions(guildId).then(log);
} else if (json === 'get_permissions') {
  getPermissions(guildId, process.argv[4]).then(log);
} else if (json === 'edit_permissions') {
  const value = process.argv[6];
  editPermissions(guildId, process.argv[4], process.argv[5], !value || value === 'true').then(log);
} else {
  createCommand(json, guildId).then(log);
}