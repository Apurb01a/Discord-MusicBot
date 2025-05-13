require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Command loader
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.data.name, command);
  }
}

// Event loader
const eventFolders = fs.readdirSync('./events');
for (const folder of eventFolders) {
  const eventFiles = fs.readdirSync(`./events/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(`./events/${folder}/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// DisTube
client.distube = new DisTube(client, {
  leaveOnEmpty: false,
  leaveOnFinish: false,
  plugins: [new SpotifyPlugin()]
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  logger.success('Connected to MongoDB');
  client.login(process.env.TOKEN);
}).catch(err => logger.error(err));
