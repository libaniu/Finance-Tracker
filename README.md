# Myllet Personal Finance Tracker

Aplikasi web *mobile-first* untuk mencatat dan mengelola keuangan pribadi (pemasukan dan pengeluaran) secara efisien dengan bantuan AI.

## Teknologi

Next.js, TypeScript, Tailwind CSS, Supabase, dan Google Gemini AI.

## Fitur Utama

- Pencatatan cepat untuk transaksi harian (pemasukan & pengeluaran).
- **AI Receipt Scanner**: Otomatis membaca data dari foto struk belanja menggunakan AI.
- **Financial Advisor (AI)**: Memberikan saran keuangan personal berdasarkan data transaksi.
- Dashboard statistik, filter bulan, dan fitur limit anggaran bulanan (*Smart Budgeting*).
- Portal autentikasi (login/register) menggunakan Supabase Auth.

## Cara Menjalankan Proyek

1.  Clone repositori & instal dependensi:

    ```bash
    git clone https://github.com/libaniu/myllet
    cd myllet
    npm install
    ```

2.  Buat file .env.local di root folder dan isi konfigurasi database beserta API Key:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
    GEMINI_API_KEY=<your-gemini-api-key>
    ```


3.  Jalankan server lokal:
    ```Bash
    npm run dev
    ```
    Buka http://localhost:3000.