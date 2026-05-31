require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  AttachmentBuilder
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");

const play = require("play-dl");

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
const players = new Map();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
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
    if (!message.member.permissions.has("Administrator")) {
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
    const searchResult = await play.search(query, {
      limit: 1
    });

    if (!searchResult.length) {
      return message.reply("I couldn't find that song.");
    }

    const song = searchResult[0];
    const stream = await play.stream(song.url);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    player.play(resource);
    connection.subscribe(player);

    players.set(message.guild.id, { player, connection });

    message.reply(`Playing: ${song.title}`);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
      players.delete(message.guild.id);
    });

  } catch (error) {
    console.error(error);
    message.reply("Something went wrong while playing the song.");
  }
});

client.login(process.env.TOKEN);
