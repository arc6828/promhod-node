const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

require("dotenv").config();

// ใช้ API Key จาก environment variable เพื่อความปลอดภัย
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {

  const prompt = "คุณเป็นใคร";

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
    });
    const text = response.text;
    console.log(text);
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
  }
}

// run();

// 1.function load ไฟล์ flood-index-thairath.json as json
function loadFloodIndex() {
  const data = fs.readFileSync("flood-index-thairath.json");
  return JSON.parse(data);
}

// 2. function scrape

async function scrapeAndSave(url) {
  try {
    // 1. โหลด HTML with fetch
    const response = await fetch(url);
    const data = await response.text();

    // 2. ใช้ cheerio เพื่อ extract ข้อมูล
    const $ = cheerio.load(data);

    // ตัวอย่าง: ดึง title และ paragraphs
    const title = $("title").text();
    const paragraphs = [];
    $("p").each((i, el) => {
      paragraphs.push($(el).text().trim());
    });

    // 3. สร้าง JSON object
    const result = {
      url,
      title,
      content: paragraphs,
      scrapedAt: new Date().toISOString()
    };

    // 4. เขียนไฟล์ JSON
    fs.writeFileSync("output.json", JSON.stringify(result, null, 2), "utf-8");

    console.log("✅ Scraping complete! Data saved to output.json");
  } catch (err) {
    console.error("❌ Error scraping site:", err.message);
  }
}

// 1. load Flood Index
let data = loadFloodIndex();

