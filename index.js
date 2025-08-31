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
    // console.log(text);
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
  }
}

// run();

// 1. loop through data-detail folder and read all files
// 2. for each file, read the content and send to gemini-2.5-flash-lite model
// 3. save the response to a new file in the output folder with the same name as the input file
async function processFiles() {
  const inputDir = "./data-detail";
  const outputDir = "./output";

  // สร้างโฟลเดอร์ output ถ้ายังไม่มี
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const filePath = `${inputDir}/${file}`;
    const outputFilePath = `${outputDir}/${file}`;

    // if output file already exists, skip
    if (fs.existsSync(outputFilePath)) {
      console.log(`File already processed, skipping: ${file}`);
      continue;
    }

    try {
      const start = Date.now(); // เริ่มจับเวลา

      const content = fs.readFileSync(filePath, "utf-8");
      console.log(`Processing file: ${file}`);
      // console.log("content:", content);
      const obj_content = JSON.parse(content);
      // console.log("Original message:", obj_content);
      // create a new json
      const new_content = {
        title: obj_content.title,
        date: obj_content.publish_date,
        url: obj_content.url,
        original_message: obj_content.ner_obj.original_message,
      };

      // create a prompt with new_content + " สรุปใจความสำคัญเป็นข้อๆ ตามรูปแบบดังต่อไปนี้ 1. 2. 3."
      const prompt =
        JSON.stringify(new_content) +
        "\n สรุปตอบเป็น JSON Array สำหรับในบางกรณีมีหลาย location" +
        "\n - date as format ISO8601 YYYY-MM-DD" +
        "\n - location as province in thailand" +
        "\n - severity (low/medium/high)" +
        "\n - URL";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });
      const text = response.text;
      const cleanedText = text.replace(/```json|```/g, "");

      const end = Date.now(); // จับเวลาสิ้นสุด
      const duration = end - start; // คำนวณ duration

      // console.log("Response:", cleanedText);
      // console.log(`Processing time: ${duration} ms`);

      // สร้าง JSON สำหรับบันทึกผลลัพธ์
      const outputJson = {
        result: JSON.parse(cleanedText),
        duration_ms: duration,
      };
      // stringify
      const outputJsonString = JSON.stringify(outputJson);

      fs.writeFileSync(outputFilePath, outputJsonString, "utf-8");
      console.log(`Saved response to: ${outputFilePath}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
    // break; // Remove this line to process all files
  }
}

// processFiles();

// function calculate duration of file json in folder output
function calculateTotalDuration() {
  const outputDir = "./raw";
  const files = fs.readdirSync(outputDir);
  let totalDuration = 0;

  for (const file of files) {
    const filePath = `${outputDir}/${file}`;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const obj_content = JSON.parse(content);
      if (obj_content.duration_ms) {
        totalDuration += obj_content.duration_ms;
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  console.log(`Total processing duration for all files: ${totalDuration} ms`);
}
calculateTotalDuration();

// read flood-index-thairath.json and print URLs
async function readFloodIndex() {
  const filePath = "./flood-index-thairath.json";
  const cheerio = require("cheerio");

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const obj_content = JSON.parse(content);
    for (const item of obj_content) {
      
      // use last block of URL as filename
      const urlParts = item.url.split("/");
      const filename = urlParts[urlParts.length - 1] + ".json";
      
      const outputFilePath = `./raw/${filename}`;
      // if output file already exists, skip
      if (fs.existsSync(outputFilePath)) {
        console.log(`File already processed, skipping: ${filename}`);
        continue;
      }

      const start = Date.now(); // เริ่มจับเวลา

      // console.log(item.url);
      // fetch item.url and extract the article content with cheerio

      // fetch https://www.thairath.co.th/news/local/2833704 and extract the article content with cheerio
      const text = await fetch(item.url) ;
      // const text = await fetch("https://www.thairath.co.th/newspaper/2831027");
      const html = await text.text();
      // extract the article content with cheerio
      const $ = cheerio.load(html);

      const date = $(".__item_article-date").text().trim();
      // const article = $("#__NEXT_DATA__").text().trim();
      // // loop through articles and join the text
      // let article = "";
      // articles.each((i, elem) => {
      //   article += $(elem).text().trim() + "\n";
      // } );
      // article = article.trim();
      //
      // console.log("article:", JSON.parse(articles));


      const end = Date.now(); // จับเวลาสิ้นสุด
      const duration = end - start; // คำนวณ duration

      // สร้าง JSON สำหรับบันทึกผลลัพธ์
      const outputJson = {
        date: date,
        article: "",
        url: item.url,
        duration_ms: duration,
      };

      // stringify
      const outputJsonString = JSON.stringify(outputJson);

      // then save to raw folder with filename as .html
      fs.writeFileSync(`./raw/${filename}`, outputJsonString, "utf-8");
      console.log(`Saved article to: ./raw/${filename}`);

      // break; // remove this line to process all items
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
}
// readFloodIndex();
