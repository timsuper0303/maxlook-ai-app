// ═══════════════════════════════════════════════════════
// Email Service — Resend integration
// Templates: activation email (token + access link)
// Docs: https://resend.com/docs
// ═══════════════════════════════════════════════════════

const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Maxlook <onboarding@resend.dev>';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;

let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('[email] RESEND_API_KEY belum di-set — email tidak akan terkirim. Set di .env.');
}

// ── Activation email template ─────────────────────────────
function buildActivationEmailHTML({ name, token, gender, accessLink }) {
  const isWoman = gender === 'woman';
  const variant = isWoman ? 'Woman' : 'Man';
  const accent = isWoman ? '#E8639A' : '#FF0000';
  const bg = isWoman ? '#FFF5F7' : '#0a0a0a';
  const text = isWoman ? '#3A1020' : '#ffffff';
  const sapaan = isWoman ? 'kamu' : 'lo';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Akses Maxlook ${variant} udah Aktif</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:${bg};color:${text};">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bg};">
<tr><td align="center" style="padding:40px 20px;">
  <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${isWoman ? '#ffffff' : '#1a1a1a'};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">

    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,${accent},${isWoman ? '#B03070' : '#ff6633'});padding:36px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:800;letter-spacing:-0.02em;">
        ✨ Maxlook ${variant}
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
        Akses ${sapaan} udah aktif
      </p>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:36px 32px;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        Halo <strong>${name}</strong>! 💖
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${isWoman ? 'rgba(58,16,32,0.75)' : 'rgba(255,255,255,0.75)'};">
        Selamat — pembelian ${sapaan} confirmed.<br>
        Akses Maxlook ${variant} udah ready buat ${sapaan} pakai 24/7, lifetime access.
      </p>

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
        <tr><td align="center">
          <a href="${accessLink}"
             style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:50px;font-weight:800;font-size:15px;letter-spacing:0.02em;">
            🚀 Mulai Scan Wajah Sekarang
          </a>
        </td></tr>
      </table>

      <!-- Token info -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${isWoman ? '#FFF5F7' : 'rgba(255,255,255,0.04)'};border-radius:12px;margin:24px 0;padding:0;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${accent};margin-bottom:8px;">
            🔐 Token Akses ${sapaan === 'kamu' ? 'kamu' : 'lo'}
          </div>
          <div style="font-family:'Courier New',Consolas,monospace;font-size:18px;font-weight:800;letter-spacing:0.05em;color:${text};">
            ${token}
          </div>
          <div style="font-size:12px;color:${isWoman ? 'rgba(58,16,32,0.6)' : 'rgba(255,255,255,0.55)'};margin-top:8px;line-height:1.5;">
            Simpan token ini. Klik tombol di atas atau copy link ini:<br>
            <span style="word-break:break-all;font-size:11px;">${accessLink}</span>
          </div>
        </td></tr>
      </table>

      <!-- What you get -->
      <h2 style="margin:32px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:800;color:${text};">
        Yang ${sapaan} dapet:
      </h2>
      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;line-height:1.9;color:${isWoman ? 'rgba(58,16,32,0.85)' : 'rgba(255,255,255,0.85)'};">
        <li><strong>AI Glow Up Scanner</strong> — 5-dimensi analisis (skin, simetri, jawline, mata, harmony)</li>
        <li><strong>Personal Color Analysis</strong> — palette warna 12-season + warna yang harus dihindari</li>
        <li><strong>Skincare Routine</strong> — AM/PM steps dengan rekomendasi produk lokal Indonesia</li>
        <li><strong>Outfit Ideas</strong> — kombinasi outfit per occasion (kerja, casual, date)</li>
        <li><strong>30-Day Roadmap</strong> — blueprint personalize per dimensi</li>
        <li><strong>Glow Up Bible + Workbook</strong> — long-form guide + daily checklist</li>
        <li><strong>Re-scan tiap minggu</strong> — track progress lifetime</li>
      </ul>

      <!-- Important note -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${isWoman ? 'rgba(232,99,154,0.08)' : 'rgba(255,180,0,0.08)'};border-left:4px solid ${accent};border-radius:8px;margin:28px 0 0;">
        <tr><td style="padding:14px 18px;">
          <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${accent};margin-bottom:6px;">
            ⚠️ Penting
          </div>
          <div style="font-size:13px;line-height:1.6;color:${text};">
            Akses cuma berlaku di <strong>1 device</strong> (HP/laptop ${sapaan}).
            Klik link akses di device yang mau ${sapaan} pake.
            Mau ganti device? Reply email ini, gue (Hans) reset manual.
          </div>
        </td></tr>
      </table>

    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 32px;background:${isWoman ? '#FFF5F7' : 'rgba(255,255,255,0.03)'};border-top:1px solid ${isWoman ? 'rgba(232,99,154,0.15)' : 'rgba(255,255,255,0.08)'};text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:${isWoman ? 'rgba(58,16,32,0.6)' : 'rgba(255,255,255,0.55)'};">
        Pertanyaan? Reply email ini langsung — gue (Hans) personal jawab 24/7.
      </p>
      <p style="margin:0;font-size:11px;color:${isWoman ? 'rgba(58,16,32,0.4)' : 'rgba(255,255,255,0.35)'};">
        © Maxlook · Email otomatis · Jangan reply ke noreply, reply ke email ini langsung.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

function buildActivationEmailText({ name, token, gender, accessLink }) {
  const variant = gender === 'woman' ? 'Woman' : 'Man';
  const sapaan = gender === 'woman' ? 'kamu' : 'lo';
  return `Halo ${name}!

Selamat — akses Maxlook ${variant} udah aktif.

🔗 Klik link di bawah buat mulai scan:
${accessLink}

🔐 Token akses: ${token}

Yang ${sapaan} dapet:
• AI Glow Up Scanner (5-dimensi)
• Personal Color Analysis
• Skincare Routine
• Outfit Ideas
• 30-Day Roadmap
• Glow Up Bible + Workbook
• Re-scan tiap minggu (lifetime)

⚠️ Akses berlaku di 1 device aja. Klik link di device yang mau ${sapaan} pake.

Pertanyaan? Reply email ini langsung.

— Tim Maxlook`;
}

// ── Send activation email ─────────────────────────────────
async function sendActivationEmail({ to, name, token, gender, baseUrl }) {
  if (!resend) {
    return { ok: false, error: 'Resend not configured (RESEND_API_KEY missing in .env)' };
  }
  if (!to) {
    return { ok: false, error: 'Email address kosong' };
  }

  const accessLink = `${baseUrl || PUBLIC_URL}/?token=${encodeURIComponent(token)}`;
  const variant = gender === 'woman' ? 'Woman' : 'Man';

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: `✨ Akses Maxlook ${variant} udah aktif, ${name}!`,
      html: buildActivationEmailHTML({ name, token, gender, accessLink }),
      text: buildActivationEmailText({ name, token, gender, accessLink })
    });

    if (error) {
      console.error('[email.sendActivationEmail] Resend error:', error);
      return { ok: false, error: error.message || JSON.stringify(error) };
    }

    return { ok: true, messageId: data?.id || null };
  } catch (err) {
    console.error('[email.sendActivationEmail] Exception:', err);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  sendActivationEmail,
  buildActivationEmailHTML,  // exported for preview/testing
  buildActivationEmailText,
  isConfigured: () => !!resend
};
