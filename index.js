require("dotenv").config();

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
  emitNewSongOnly: true
});

const PREFIX = "2P";

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

  console.log("MESSAGE:", message.content);

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

  console.log("VOICE CHANNEL:", voiceChannel.name);
  console.log("VOICE ID:", voiceChannel.id);
  console.log("STARTING PLAY...");

  await distube.play(voiceChannel, query, {
    textChannel: message.channel,
    member: message.member
  });

  console.log("PLAY COMMAND SENT");

} catch (error) {
  console.error(error);
  message.reply("Something went wrong while playing the song.");
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
    console.log("VOICE CHANNEL:", voiceChannel.name);
console.log("VOICE ID:", voiceChannel.id);
    await distube.play(voiceChannel, query, {
      textChannel: message.channel,
      member: message.member
    });
  } catch (error) {
    console.error(error);
    message.reply("Something went wrong while playing the song.");
  }
});

distube
  .on("playSong", (queue, song) => {
    queue.textChannel.send(`Playing: ${song.name}`);
  })
  .on("addSong", (queue, song) => {
    queue.textChannel.send(`Added: ${song.name}`);
  })
  .on("error", (channel, error) => {
    console.error(error);
    if (channel) channel.send("Music error. Try another song or link.");
  });

client.login(process.env.TOKEN);
