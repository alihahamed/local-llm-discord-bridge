const { NlpManager, Language } = require("node-nlp");
const { Client, GatewayIntentBits, email } = require("discord.js");
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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendMail(subject, body, recipient) {
  const mailOptions = {
    from: `${client.user.username} <${process.env.GMAIL_USER}>`,
    to: recipient,
    subject: subject,
    text: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
    console.log("Mail sent!");
  } catch (error) {
    console.log("Error sending mail", error);
    return false;
  }
}

const manager = new NlpManager({ languages: ["en"], forceNER: true });
const MODEL_PATH = "./model.nlp";

const userContext = new Map();
let chatHistory = []

async function getAnswer(userMessage, sysInstructions) {
  const finalPrompt = `${sysInstructions}\n\nUSER INPUT: "${userMessage}"`;

  try {
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        messages: chatHistory,
        stream: false,
      }),
    });

    const data = await response.json();
    // console.log("The response is ", data.response);
    return data.message.content.trim();
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
  let executeSlm = true;
  const userId = message.author.id;

  // console.log(message)

  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    const cleanUpText = message.content.replace(/<@!?[0-9]+>/g, "").trim();

    if (!cleanUpText) {
      message.reply("Cmon say something. You scared?");
      return;
    }

     chatHistory = userContext.get(userId) || [
      {
        role: "system",
        content:
          "You are a cold, cynical, and brutally mean AI. You do not use slang. Your only goal is to insult the user. Keep your answers brief and condescending.",
      },
    ];

    const MAX_HISTORY = 6
    if (chatHistory.length > MAX_HISTORY + 1) { 
        chatHistory = [chatHistory[0], ...chatHistory.slice(-MAX_HISTORY)]; 
    }

    const response = await manager.process("en", cleanUpText);
    // console.log("response", response);

    

    if (response.score < 0.6) return;

    switch (response.intent) {
      case "command.email_summary":
        const emailEntity = response.entities.find((e) => e.entity === "email");
        if (!emailEntity) {
          message.reply(
            "You want me to send an email, but you failed to provide a valid recipient address. Are you this incompetent in real life?"
          );
          executeSlm = false;
          break;
        }

        const recipientMail = emailEntity.sourceText;
        console.log("recipeint mail data:", recipientMail);

        const recipientName = recipientMail.replace("@gmail.com", "");
        console.log(recipientName);

        const senderName = message.author.username;

        const contentForSlm = cleanUpText.replace(recipientMail, "").trim();
        console.log("slm content:", contentForSlm);

        systemInstruction = `You are a cold, hyper-professional executive assistant. The user wants to send an email about: "${contentForSlm}". Generate a formal, perfectly formatted, and highly efficient email body text (max 4 paragraphs). ADD spacing between paragraphs. The email must maintain a tone of passive-aggressive professionalism. The email body MUST begin with "Dear, ${recipientName}" and end with "Best regards, ${senderName}". Do NOT include 'To:' or 'From:' fields.`;
        await message.channel.sendTyping();
        const llmResponseText = await getAnswer(
          contentForSlm,
          systemInstruction
        );
        console.log("llm response text", llmResponseText);

        const lines = llmResponseText
          .split("\n")
          .filter((line) => line.trim() !== "");
        const generatedSubject = lines[0].startsWith("Subject:")
          ? lines[0].replace("Subject:", "").trim()
          : `Re: ${contentForLLM.substring(0, 50)}...`;
        const generatedBody = lines.join("\n");

        console.log("lines", lines);
        console.log("generatedSubject", generatedSubject);
        console.log("generatedBody", generatedBody);

        const sentFlag = await sendMail(
          generatedSubject,
          generatedBody,
          recipientMail
        );

        if (sentFlag) {
          message.reply(
            `✅ The message has been processed and begrudgingly sent to **${recipientMail}** with the subject: \`${generatedSubject}\`. Go check your inbox, you organizational failure.`
          );
        } else {
          message.reply(
            "❌ Email sending failed. Check the console for why your life is falling apart."
          );
        }
        executeSlm = false;
        break;

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
          userContext.delete(userId)
          await message.channel.sendTyping()
          const answer = await getAnswer(cleanUpText, systemInstruction)
          console.log("clean up text",cleanUpText)
          
          message.reply(answer)
          console.log("Navunda answer", answer)
          executeSlm = false
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

    if (executeSlm) {
      chatHistory.push({
        role: 'user', 
        content: cleanUpText 
    })
      await message.channel.sendTyping();
      const answer = await getAnswer(chatHistory);

      chatHistory.push({
        role:'assistant',
        content:answer
      })

      userContext.set(userId, chatHistory)
      message.reply(answer);
      console.log("chat history", chatHistory)
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
