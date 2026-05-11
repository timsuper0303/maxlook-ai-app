# Maxlook AI App — Fulfillment Backend

> AI Face Scanner + Customer Dashboard + 30-Day Personalized Roadmap untuk Maxlook Man & Woman SaaS.

**Stack:** Node.js · Express · JSON file DB · OpenAI SDK (via KIE.ai proxy)
**Deployment:** Local dev → VPS (Ubuntu/Debian) via PM2 atau Docker
**No JS framework, no React** — vanilla HTML + native CSS, simpler buat solo dev.

---

## 🚀 Quick Start (Local)

### 1. Install Node.js

Kalau belum punya Node.js, install dulu:
- Download dari [nodejs.org](https://nodejs.org/) (pilih LTS — minimal v18)
- Verify: buka Terminal/PowerShell ketik `node -v` (harus muncul angka v18+)

### 2. Install dependencies

Buka Terminal di folder ini, jalankan:

```bash
npm install
```

Tunggu 1-2 menit. Bakal install Express, SQLite, OpenAI SDK, multer, dll.

### 3. Setup environment variables

```bash
cp .env.example .env
```

Buka file `.env` di text editor. Default-nya udah pre-filled dengan **KIE.ai key yang ada di project lo**:

```
KIE_API_KEY=722cbdb4775fce6699de9c0c9c5823f1
KIE_API_BASE_URL=https://api.kie.ai/v1
AI_VISION_MODEL=gpt-4o
PORT=3000
```

Kalau ada limit/issue dengan KIE.ai key, ganti dengan API key OpenAI sendiri:

```
KIE_API_KEY=sk-proj-xxx... (key OpenAI lo)
KIE_API_BASE_URL=https://api.openai.com/v1
```

(Tetep pake var name `KIE_API_KEY` — kompatibel sama OpenAI direct)

### 4. Run server

```bash
npm start
```

Bakal muncul:

```
═══════════════════════════════════════════════════════
  ✨ Maxlook AI App jalan di http://localhost:3000
═══════════════════════════════════════════════════════
```

Buka browser: [http://localhost:3000](http://localhost:3000)

---

## 👤 Workflow Customer Onboarding

### Step 1: Customer bayar di orderonline.id

Customer pay Rp199.000 via orderonline checkout. Lo dapet notif payment masuk via WhatsApp/Email.

### Step 2: Bikin user baru di Maxlook AI

Di Terminal:

```bash
npm run create-user
```

Atau dengan args langsung:

```bash
npm run create-user -- --name "Nina Sari" --gender woman --phone "+628123456789"
```

Output:

```
═══════════════════════════════════════════════════════
   ✅ User berhasil dibuat
═══════════════════════════════════════════════════════

  ID:       1
  Nama:     Nina Sari
  Gender:   woman
  Token:    AB7CD2EFG3HJK9

  📲 KIRIM LINK INI VIA WHATSAPP:
  http://localhost:3000/?token=AB7CD2EFG3HJK9

  📝 Template WhatsApp message:
  (auto-generated, tinggal copy-paste)
```

### Step 3: Kirim link via WhatsApp ke customer

Copy template message yang muncul di terminal, paste ke WhatsApp customer.

### Step 4: Customer akses tool

Customer klik link → langsung masuk dashboard, bisa upload selfie, dapet hasil AI scan + 30-day roadmap.

### Step 5: Re-scan setiap minggu

Customer bisa re-scan 1× per 7 hari (rate limit). Track progress lewat dashboard.

---

## 📋 Available Commands

```bash
npm start                # Start server (production-ish)
npm run dev              # Start with auto-restart on file change
npm run create-user      # Bikin user baru (interactive prompt)
npm run list-users       # List semua user + access link
```

---

## 🗂️ Project Structure

```
maxlook-ai-app/
├── package.json
├── .env.example          ← copy ke .env, isi KIE_API_KEY
├── .gitignore
├── server.js             ← Express server entry point
├── src/
│   ├── db.js             ← SQLite database & queries
│   ├── auth.js           ← Token-based auth middleware
│   ├── openai-client.js  ← OpenAI SDK config (KIE.ai proxy)
│   ├── scan-handler.js   ← Orchestrate AI scan
│   ├── roadmap-generator.js  ← Generate personalized 30-day HTML
│   └── prompts/
│       └── face-scan-prompt.js ← Prompt template for AI
├── public/               ← Static HTML pages
│   ├── index.html        ← Login (token entry)
│   ├── dashboard.html    ← Customer dashboard
│   ├── scan.html         ← Upload + scan UI
│   ├── result.html       ← Single scan result
│   ├── bible-man.html    ← Glow Up Bible Man
│   ├── bible-woman.html  ← Glow Up Bible Woman
│   ├── workbook-man.html ← Action Workbook Man
│   └── workbook-woman.html
├── scripts/
│   ├── create-user.js    ← CLI bikin user post-payment
│   └── list-users.js     ← CLI list semua user
├── data/                 ← SQLite database file (auto-create)
│   └── maxlook.db
└── uploads/              ← Selfie images uploaded (auto-create)
```

---

## 🧪 Testing Flow

1. `npm install`
2. `cp .env.example .env` (pastikan `KIE_API_KEY` udah filled)
3. `npm start` → server jalan di port 3000
4. Buka new terminal → `npm run create-user` → bikin test user (e.g., gender `man`)
5. Copy access link yang muncul (e.g., `http://localhost:3000/?token=ABC123XYZ`)
6. Buka link di browser → masuk dashboard
7. Klik **"📸 Scan Wajah"** → upload selfie
8. Tunggu 20-40 detik → hasil scan muncul (5-dimensi skor + skin + color + outfit)
9. Klik **"📋 30-Day Roadmap"** → roadmap personalize buka di tab baru (HTML printable)
10. Klik **"📕 Glow Up Bible"** → long-form guide
11. Klik **"📝 Action Workbook"** → printable workbook

Test case:
- ✅ Scan selfie cowok → output cocok untuk Maxlook Man (dark theme, tone bro-energy)
- ✅ Scan selfie cewek → output cocok untuk Maxlook Woman (pearl theme, tone warm sister)
- ✅ Re-scan sebelum 7 hari → harusnya block (rate limit)
- ✅ Token invalid → harusnya 401

---

## 🔒 Security Notes

- API key (`KIE_API_KEY`) **server-side only** — JANGAN expose ke client
- Customer ngga perlu API key sendiri — semua scan via key Hans
- Token autentikasi customer di-generate random 14-char (alphanumeric, no ambiguous chars)
- Rate limit 1 scan/minggu → kontrol API cost
- File upload max 8MB, only JPG/PNG/WEBP

---

## 💰 Cost Calculation

GPT-4o Vision via KIE.ai (atau OpenAI direct):

- Per scan ~$0.01-0.03 (tergantung image size + output tokens)
- = ~Rp200-500 per scan
- Customer 1 scan/minggu × 4 minggu/bulan = 4 scans/bulan = ~Rp800-2000/bulan
- Customer beli Rp199.000 lifetime
- **Profit margin: 99%+ year 1**

---

## 🌐 Deploy ke VPS (Phase 2)

Setelah local jalan oke, deploy ke VPS:

### Option A: Direct Node.js + PM2

```bash
# Di VPS
git clone <your-repo>  # atau scp folder
cd maxlook-ai-app
npm install --production
cp .env.example .env  # edit isi keys
npm install -g pm2
pm2 start server.js --name maxlook-ai
pm2 save
pm2 startup  # auto-restart on reboot
```

Set up nginx reverse proxy untuk HTTPS + custom domain.

### Option B: Docker

(Bisa di-add nanti — Dockerfile simple)

---

## 🤝 Telegram Bot (Phase 2)

Currently skip per instruksi Hans. Setelah local + VPS jalan, gampang banget add:

1. Lo bikin bot di `@BotFather`, dapet token
2. Tambah `TELEGRAM_BOT_TOKEN=xxx` ke `.env`
3. Run `npm run start-bot` (gue add file `telegram-bot.js` next phase)
4. Customer bisa scan via Telegram parallel ke web app

Same database, same AI engine. Customer bisa pilih channel mana yang mereka prefer.

---

## 📞 Support

Kalau ada issue saat testing local, debug langkah:

1. Cek `npm install` selesai tanpa error
2. Cek `.env` udah ada `KIE_API_KEY` valid
3. Cek port 3000 ngga occupied (kalau ada, ganti `PORT=3001` di `.env`)
4. Cek terminal log saat scan — error AI bakal tampil di sana
5. Cek folder `uploads/` ada selfie yang ke-save (artinya upload jalan)
6. Cek folder `data/maxlook.db` ada (artinya DB jalan)

---

*Built untuk Hans · Maxlook AI fulfillment · 2026*
