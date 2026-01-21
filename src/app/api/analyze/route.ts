import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key mati" }, { status: 500 });
  }

  let promptText = "";

  try {
    const { transactions, summary } = await req.json();

    promptText = `
      Bertindaklah sebagai teman yang ahli keuangan.
      
      Data:
      - Masuk: Rp ${summary.income.toLocaleString("id-ID")}
      - Keluar: Rp ${summary.expense.toLocaleString("id-ID")}
      - Saldo: Rp ${summary.balance.toLocaleString("id-ID")}
      
      Top Pengeluaran:
      ${transactions.map((t: any) => `- ${t.title}: Rp ${t.amount.toLocaleString("id-ID")}`).join("\n")}

      Berikan 3 saran singkat & pedas (maksimal 2 kalimat per poin).
    `;

    const genAI = new GoogleGenerativeAI(apiKey);

    // --- GANTI KE MODEL 2.5 FLASH (Sesuai daftar akunmu) ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Mencoba Gemini 2.5 Flash...");
    const result = await model.generateContent(promptText);
    const text = result.response.text();
    console.log("Berhasil!");

    return NextResponse.json({ advice: text });
  } catch (error: any) {
    console.error("❌ Error:", error.message);

    // Kalau 2.5 gagal juga, kita coba model "cadangan terakhir" (gemini-flash-latest)
    if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("🔄 Mencoba fallback ke 'gemini-flash-latest'...");
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
        });
        const result = await fallbackModel.generateContent(promptText);
        return NextResponse.json({ advice: result.response.text() });
      } catch (err) {
        console.error("Fallback gagal");
      }
    }

    // Pesan santuy kalau limit
    if (error.message.includes("429")) {
      return NextResponse.json({
        advice: "Duh, AI-nya lagi rame antrian. Coba nanti lagi ya! ⏳",
      });
    }

    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}
