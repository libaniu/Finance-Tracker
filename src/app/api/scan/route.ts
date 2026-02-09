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

    // 2. GUNAKAN MODEL STABIL (1.5 Flash)
    // Jangan pakai 2.5 dulu karena belum stabil untuk semua akun
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const base64Data = image.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      "",
    );

    const prompt = `Analyze this receipt image. Extract data into raw JSON:
    {
      "title": "Store name (short)",
      "amount": "Total amount (number only)",
      "date": "YYYY-MM-DD (use today if missing)",
      "category": "Pick one: [${CATEGORIES}]"
    }
    No markdown. Just JSON.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    let text = response.text();

    // Bersihkan format markdown jika ada
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(text);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Scan Error:", error.message);
    return NextResponse.json(
      { error: "Gagal memproses gambar. Coba input manual." },
      { status: 500 },
    );
  }
}
