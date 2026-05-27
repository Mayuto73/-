import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF data provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY がVercelの環境変数に設定されていません。Vercelのダッシュボードで設定してください。" });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

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
              data: pdfBase64,
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
    res.status(200).json({ success: true, data: scheduleData });
  } catch (e: any) {
    console.error("Error parsing PDF:", e);
    res.status(500).json({ error: e.message || "An error occurred during parsing." });
  }
}
