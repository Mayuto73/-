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
Extract the school schedule and events from the attached timetable PDF.
It contains classes ("授業"), special events ("行事"), special duties like "労作" (labor work), and homeroom/short events.
Parse the schedule for each date and return it as a structured array.
Include ALL dates found in the document that have any events or schedule listed.
Exclude dates with nothing assigned if you prefer, but output a separate object per day.

Make sure to map the periods (1st period, 2nd period, etc.) into the "periods" array for that date. If a class occupies multiple periods, copy it to each period slot or just provide an array of strings in order.
If there are general events or duties (like 労作, 委員会, 集会) that don't fit perfectly into a numbered standard period, add them to the "events" array.
Usually there are around 1 to 8 periods.

Format the response strictly adhering to the specified schema.
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
