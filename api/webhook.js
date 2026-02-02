const { createClient } = require('@supabase/supabase-js');
const { IncomingForm } = require('formidable');

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();

  try {
    const dataInput = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields) => {
        if (err) return reject(err);
        const cleaned = {};
        for (const key in fields) {
          cleaned[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
        }
        resolve(cleaned);
      });
    });

    // Validasi Token (Pastikan WEBHOOK_SECRET di Vercel sama dengan token di URL)
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const incomingToken = req.query?.token || dataInput?.webhook_token;

    if (webhookSecret && incomingToken !== webhookSecret) {
      console.error("TOKEN TIDAK COCOK!");
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // AMBIL DATA BERDASARKAN LOG INDOFINITY
    const tiktokUsername = dataInput.username || dataInput.uniqueId;
    const amountCoins = parseInt(dataInput.coins) || 0;
    const msgId = dataInput.msgId || `tk_${Date.now()}`;

    console.log(`Memproses Topup: ${tiktokUsername} sejumlah ${amountCoins} Gold`);

    if (!tiktokUsername || amountCoins <= 0) {
      console.warn("Data tidak valid untuk topup.");
      return res.status(200).json({ status: "skipped", reason: "Invalid data" });
    }

    // BERSIHKAN USERNAME (Hapus @ jika ada)
    const cleanUsername = tiktokUsername.replace('@', '').trim();

    // PANGGIL FUNGSI SQL SUPABASE
    const { data, error } = await supabase.rpc('process_auto_topup', {
      p_tiktok_username: cleanUsername,
      p_amount_original: amountCoins,
      p_source: 'tiktok',
      p_external_id: String(msgId),
      p_rate_multiplier: 1 // 1 Coin = 1 Gold
    });

    if (error) {
      console.error("ERROR SQL SUPABASE:", error.message);
      throw error;
    }

    console.log("HASIL SUPABASE:", data);

    return res.status(200).json({
      success: true,
      message: `Berhasil menambahkan ${amountCoins} Gold ke ${cleanUsername}`,
      result: data
    });

  } catch (err) {
    console.error("RUNTIME ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
