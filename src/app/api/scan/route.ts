import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Tagihan & Utilitas",
  "Hiburan",
  "Kesehatan",
  "Investasi",
  "Lainnya",
].join(", ");

export async function POST(req: Request) {
  // 1. CEK API KEY (Cek dua kemungkinan nama variabel biar aman)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key belum dipasang di .env.local" },
      { status: 500 },
    );
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. GUNAKAN MODEL STABIL (1.5 Flash) dengan JSON Mode
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const base64Data = image.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      "",
    );

    // Prompt disederhanakan, karena kita sudah meminta JSON secara eksplisit
    const prompt = `Analyze this receipt image. Extract the store name, total amount, date, and category. Use today's date (YYYY-MM-DD) if the date is missing. Pick one category from the list: [${CATEGORIES}]. The final JSON object should look like this: {
      "title": "Store name (short)",
      "amount": "Total amount (number only)",
      "date": "YYYY-MM-DD (use today if missing)",
      "category": "Chosen category"
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
    ]);

    // Tidak perlu parsing manual, Gemini sudah memberikan objek JSON
    const parsedData = JSON.parse(result.response.text());

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Scan Error:", error.message);
    return NextResponse.json(
      { error: "Gagal memproses gambar. Coba input manual." },
      { status: 500 },
    );
  }
}
