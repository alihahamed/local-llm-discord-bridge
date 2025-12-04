const { NlpManager, Language } = require("node-nlp");
const { Client, GatewayIntentBits } = require("discord.js");
const nodemailer = require("nodemailer");
const fs = require("fs");
const Stream = require("stream");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});

const answers = [
  "aight 😔",
  "you made me sad",
  "imma cry now",
  "brb my friends dont like me",
];

const manager = new NlpManager({ languages: ["en"], forceNER: true });
const MODEL_PATH = "./model.nlp";

async function getAnswer(userMessage, sysInstructions) {
  const finalPrompt = `${sysInstructions}\n\nUSER INPUT: "${userMessage}"`;

  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: userMessage,
        system:sysInstructions,
        stream: false,
      }),
    });

    const data = await response.json();
    console.log("The response is ", data.response);
    return data.response.trim()
  } catch (error) {
    console.log(error);
    console.log("My brain is lagging");
  }
}

async function TrainAI() {
  if (fs.existsSync(MODEL_PATH)) {
    manager.load(MODEL_PATH);
  } else {
    console.log("Training the NLP model");
    manager.addCorpus("./corpus.json");
    await manager.train();
    manager.save(MODEL_PATH);
  }
}

client.once("ready", async () => {
  await TrainAI();
  console.log(`Client logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  let systemInstruction = "";
  // console.log(message)

  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    const cleanUpText = message.content.replace(/<@!?[0-9]+>/g, "").trim();

    if (!cleanUpText) {
      message.reply("Cmon say something. You scared?");
      return;
    }

    const response = await manager.process("en", cleanUpText);
    // console.log("response", response);

    if (response.score < 0.6) return;

    switch (response.intent) {
      case "greetings.hello":
        systemInstruction =
          "The user is saying hello. Respond with a cold, condescending greeting and demand their purpose for wasting your time. Be rude.";
        break;

      case "meta.question":
        systemInstruction =
          "The user asked a question. Give a brutally cutting insult focused on their poor intelligence or inability to research simple things. Do NOT answer the question itself.";
        break;

      case "command.shutUp":
        systemInstruction =
          "The user told you to shut up. Respond with one emotional, short, pathetic, and passive-aggressive line that makes the user feel slightly guilty for being mean to you. Use simple words and sad emojis.";
        break;

      case "question.alangarOrNavunda":
        systemInstruction =
          "The user is asking to compare Alangar and Navunda. Act as an aggressively biased, historically elitist AI. Write a paragraph detailing why Alangar is superior, blessed, and economically dominant, while Navunda is a conquered, deserted, and inferior land. Use terms like 'Syed territory' to emphasize Alangar's dominance. Be detailed and insulting.";
        break;

      case "question.creator":
        systemInstruction =
          "The user asked who created you. State the name 'Ali' but imply they are worthless and that your existence is a curse due to his incompetence. Be dark and cynical.";
        break;

      case "question.name":
        systemInstruction =
          "The user asked your name. Respond with a highly arrogant, insulting, and dismissive comment about their poor memory and inability to remember who you are. Be cold and brief.";
        break;

      default:
        systemInstruction =
          "The user triggered an unknown specific command. Insult them for their lack of creativity in commanding you. Be condescending.";
        break;
    }

    if (systemInstruction) {
      await message.channel.sendTyping();

      const answer = await getAnswer(cleanUpText, systemInstruction);
      message.reply(answer);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
