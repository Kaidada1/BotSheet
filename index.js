require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { google } = require("googleapis");
const fs = require("fs");

const credentials = JSON.parse(fs.readFileSync("credentials.json"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!readsheet") {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A1:B10",
      });
      const rows = res.data.values;

      if (!rows || rows.length === 0) {
        message.reply("⚠️ Sheet is empty.");
        return;
      }

      const formatted = rows.map(row => row.join(" | ")).join("\n");
      message.reply("📄 Sheet data:\n" + "```\n" + formatted + "\n```");
    } catch (error) {
      console.error("Error reading sheet:", error);
      message.reply("❌ Failed to read Google Sheet.");
    }
  }

  if (message.content.startsWith("!addsheet ")) {
    const content = message.content.replace("!addsheet ", "").split(",");
    if (content.length < 2) {
      return message.reply("📌 Usage: `!addsheet value1,value2`");
    }

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Sheet1!A:B",
        valueInputOption: "RAW",
        requestBody: {
          values: [content],
        },
      });
      message.reply("✅ Data added to sheet!");
    } catch (error) {
      console.error("Error adding data:", error);
      message.reply("❌ Failed to add to Google Sheet.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);