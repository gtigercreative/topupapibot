// Gunakan require (CommonJS) agar tidak bentrok dengan package.json
const { createClient } = require('@supabase/supabase-js');
const { IncomingForm } = require('formidable');

// PENTING: Matikan body parser bawaan Vercel agar formidable bisa bekerja
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

// Inisialisasi Supabase di luar handler
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // 1. Cek Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm();

  try {
    // 2. Parse FormData (Indofinity mengirim format ini)
    const dataInput = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        
        // Formidable v3 mengembalikan fields dalam array [value], kita ambil isinya saja
        const cleanFields = {};
        for (const key in fields) {
          cleanFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
        }
        resolve(cleanFields);
      });
    });

    // 3. INI CARA NGINTIP DATA: Cek di Vercel Dashboard > Logs
    console.log("--- WEBHOOK DATA MASUK ---");
    console.log("Data Mentah:", JSON.stringify(dataInput, null, 2));
    console.log("---------------------------");

    // 4. Verifikasi Token Keamanan
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const incomingToken = req.headers['x-sociabuzz-token'] || dataInput?.webhook_token || req.query?.token;

    if (webhookSecret && incomingToken !== webhookSecret) {
      console.log("Token Invalid:", incomingToken);
      return res.status(401).json({ error: 'Unauthorized: Invalid Security Token' });
    }

    // 5. Ekstrak Variabel
    let tiktokUsername = dataInput.username || dataInput.nickname;
    let amount = parseFloat(dataInput.coins) || 0;
    let source = 'tiktok';
    let externalId = dataInput.msgId || `tk_${Date.now()}`;
    let multiplier = 1;

    // Fallback untuk SociaBuzz
    if (!tiktokUsername && dataInput.voter_name) {
      source = 'sociabuzz';
      tiktokUsername = dataInput.voter_name;
      amount = parseFloat(dataInput.amount) || 0;
      externalId = dataInput.transaction_id || `sb_${Date.now()}`;
      multiplier = 0.01;
    }

    if (!tiktokUsername || amount <= 0) {
      console.log("Payload tidak lengkap:", dataInput);
      return res.status(400).json({ error: 'Missing Fields', received: dataInput });
    }

    // 6. Jalankan Fungsi Database
    const cleanUsername = tiktokUsername.replace('@', '').trim();

    const { data, error } = await supabase.rpc('process_auto_topup', {
      p_tiktok_username: cleanUsername,
      p_amount_original: amount,
      p_source: source,
      p_external_id: String(externalId),
      p_rate_multiplier: multiplier
    });

    if (error) throw error;

    console.log("Topup Berhasil:", cleanUsername, "Coins:", amount);
    return res.status(200).json(data);

  } catch (err) {
    console.error("Error Detail:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
