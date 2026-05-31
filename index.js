require("dotenv").config();

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const { LavalinkManager } = require("lavalink-client");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = "2P";

client.lavalink = new LavalinkManager({
  nodes: [
    {
      id: "main",
      host: process.env.LAVALINK_HOST,
      port: Number(process.env.LAVALINK_PORT),
      authorization: process.env.LAVALINK_PASSWORD,
      secure: process.env.LAVALINK_SECURE === "true"
    }
  ],
  sendToShard: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  autoSkip: true,
  client: {
    id: process.env.CLIENT_ID,
    username: "mo-tabie"
  }
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.lavalink.init({
    id: client.user.id,
    username: client.user.username
  });
});

client.on("raw", data => {
  client.lavalink.sendRawData(data);
});

client.on("guildMemberAdd", member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  channel.send(`Welcome ${member}!`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const content = message.content.trim();

  if (content.startsWith("!setpfp") || content.startsWith("!changepfp")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("You need administrator permission.");
    }

    const imageUrl = content.split(" ")[1];

    if (!imageUrl) {
      return message.reply("Send an image URL.");
    }

    try {
      await client.user.setAvatar(imageUrl);
      return message.reply("Bot profile picture updated.");
    } catch (error) {
      console.error(error);
      return message.reply("Invalid image URL or Discord blocked the change.");
    }
  }

  if (!content.startsWith(PREFIX)) return;

  const query = content.slice(PREFIX.length).trim();

  if (!query) {
    return message.reply("Write a song name after 2P.");
  }

  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.reply("Join a voice channel first.");
  }

  try {
    const player = client.lavalink.createPlayer({
      guildId: message.guild.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: message.channel.id,
      selfDeaf: true
    });

    await player.connect();

    const result = await player.search(
      {
        query: `ytsearch:${query}`
      },
      message.author
    );

    console.log(result);

    if (!result || !result.tracks || result.tracks.length === 0) {
      return message.reply("I couldn't find that song.");
    }

    const track = result.tracks[0];

    await player.queue.add(track);

await player.setVolume(100);

if (!player.playing) {
  await player.play();
}

  } catch (error) {
    console.error(error);
    message.reply("Music error. Lavalink could not play this song.");
  }
});

client.lavalink.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel) channel.send(`Now playing: ${track.info.title}`);
});

client.lavalink.on("queueEnd", player => {
  player.destroy();
});

client.lavalink.on("nodeConnect", node => {
  console.log(`Lavalink connected: ${node.id}`);
});

client.lavalink.on("nodeError", (node, error) => {
  console.error(`Lavalink node error: ${node.id}`, error);
});

client.login(process.env.TOKEN);
