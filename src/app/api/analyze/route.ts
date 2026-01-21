import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Define API Key di PALING ATAS (supaya bisa dibaca di try maupun catch)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key belum disetting" }, { status: 500 });
  }

  // 2. Siapkan variabel untuk teks perintah
  let promptText = "";

  try {
    const { transactions, summary } = await req.json();

    // 3. Isi variabel promptText
    promptText = `
      Bertindaklah sebagai teman yang ahli keuangan (Financial Advisor).
      Gunakan Bahasa Indonesia yang santai, gaul, dan sedikit humoris.
      
      Analisa data keuangan user bulan ini:
      - Pemasukan: Rp ${summary.income.toLocaleString('id-ID')}
      - Pengeluaran: Rp ${summary.expense.toLocaleString('id-ID')}
      - Saldo Akhir: Rp ${summary.balance.toLocaleString('id-ID')}
      
      5 Pengeluaran Terbesar:
      ${transactions.map((t: any) => `- ${t.title}: Rp ${t.amount.toLocaleString('id-ID')}`).join("\n")}

      Tugasmu:
      1. Berikan komentar singkat tentang kondisi keuangan ini.
      2. Berikan 3 tips konkret yang bisa dilakukan besok.
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // MODEL UTAMA: Kita coba 'gemini-2.0-flash' (Paling baru)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log("🤖 Mencoba Gemini 2.0 Flash...");
    const result = await model.generateContent(promptText); // Pakai promptText
    const response = await result.response;
    const text = response.text();
    console.log("✅ Berhasil!");

    return NextResponse.json({ advice: text });

  } catch (error: any) {
    console.error("❌ Error Utama:", error.message);

    // KENA LIMIT (429)
    if (error.message.includes("429") || error.message.includes("Quota exceeded")) {
        return NextResponse.json({ 
            advice: "Waduh, AI-nya lagi pusing (Kuota Limit). Coba tunggu 1 menit lagi ya, nanti bisa lagi! ⏳" 
        });
    }

    // FALLBACK (Jika model 2.0 gagal/404, coba model 1.5)
    if (error.message.includes("404") || error.message.includes("not found")) {
        console.log("🔄 Mencoba fallback ke 'gemini-1.5-flash'...");
        try {
            const genAI = new GoogleGenerativeAI(apiKey); // apiKey aman diakses disini
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
            
            // Pakai promptText yang sama (aman karena didefinisikan di luar)
            const result = await fallbackModel.generateContent(promptText);
            return NextResponse.json({ advice: result.response.text() });
        } catch (fbError) {
            console.error("❌ Fallback gagal juga.");
        }
    }

    return NextResponse.json({ 
      error: "Gagal memproses AI", 
      details: error.message 
    }, { status: 500 });
  }
}