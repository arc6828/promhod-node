const { GoogleGenAI } = require("@google/genai");

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

run();