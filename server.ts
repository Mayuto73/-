import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup multer for memory storage
  const upload = multer({ storage: multer.memoryStorage() });

  // Add middleware to parse JSON
  app.use(express.json({ limit: "50mb" }));

  app.post("/api/parse-schedule-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const fileBuffer = req.file.buffer;
      const base64Data = fileBuffer.toString("base64");

      const prompt = `
添付された時間割PDFから、各日付のスケジュールと行事を抽出してください。

【超重要】
この時間割表には「K1-1」「K1-2」「K2-1」など、複数のクラスの列が並んでいます。
全体をまるめて「各科授業」などの曖昧な言葉で**絶対に要約しないでください**。
必ず**「K1-1」（一番左のクラス）の列だけ**を見て、その列に書かれている**具体的な科目名**（例：「現代の国語」「数学IA」「体育」など）をそのまま抽出してください。
省略や要約は一切禁止です。実際のセルにあるテキストをそのまま取り出してください。

・1限目、2限目などの時限ごとの授業を、順番に \`periods\` の配列に入れてください。
・労作、委員会、集会、HR、休校など、時限枠に当てはまらない行事やスケジュールは \`events\` の配列に入れてください。
・時限が空欄の場合は空文字を入れるかスキップして構成を合わせてください。

指定されたJSONスキーマに厳密に従ってください。
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "application/pdf"
              }
            },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: {
                  type: Type.STRING,
                  description: "Date of the schedule in YYYY-MM-DD format (e.g., 2026-04-06 or 2026-05-08). Infer the year if missing."
                },
                periods: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of classes/subjects for each period in order (1st, 2nd, 3rd...)."
                },
                events: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Special events, duties (労作), homeroom (HR), short assemblies outside standard periods."
                }
              },
              required: ["date", "periods", "events"]
            }
          }
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) {
        throw new Error("Failed to parse response text.");
      }

      const scheduleData = JSON.parse(jsonStr);
      res.json({ success: true, data: scheduleData });
    } catch (e: any) {
      console.error("Error parsing PDF:", e);
      res.status(500).json({ error: e.message || "An error occurred during parsing." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer();
