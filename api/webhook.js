import { createClient } from '@supabase/supabase-js';
import { IncomingForm } from 'formidable';

// PENTING: Matikan body parser bawaan Vercel agar formidable bisa bekerja
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Promise wrapper untuk parse FormData
  const dataInput = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      // Formidable mengembalikan fields dalam bentuk array jika ada multiple, 
      // kita ambil index [0] atau stringnya saja
      const cleanFields = {};
      for (const key in fields) {
        cleanFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      }
      resolve(cleanFields);
    });
  });

  const webhookSecret = process.env.WEBHOOK_SECRET;
  const incomingToken = req.headers['x-sociabuzz-token'] || dataInput?.webhook_token || req.query?.token;

  if (webhookSecret && incomingToken !== webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Security Token' });
  }

  try {
    let tiktokUsername = '';
    let amount = 0;
    let source = '';
    let externalId = '';
    let multiplier = 1;

    // DETEKSI INDOFINITY / TIKFINITY (FormData)
    // Berdasarkan gambar: {username} {nickname} {coins}
    if (dataInput.coins || dataInput.giftname) {
      source = 'tiktok';
      // Indofinity biasanya mengirim placeholder sesuai yang kamu set
      tiktokUsername = dataInput.username || dataInput.nickname;
      amount = parseFloat(dataInput.coins) || 0;
      externalId = dataInput.msgId || `tk_${Date.now()}`;
      multiplier = 1; 
    } 
    // DETEKSI SOCIABUZZ (Fallback)
    else if (dataInput.voter_name || dataInput.amount) {
      source = 'sociabuzz';
      tiktokUsername = dataInput.voter_name; 
      amount = parseFloat(dataInput.amount) || 0;
      externalId = dataInput.transaction_id || `sb_${Date.now()}`;
      multiplier = 0.01; 
    }

    if (!tiktokUsername || amount <= 0) {
      console.log("Payload diterima tapi tidak lengkap:", dataInput);
      return res.status(400).json({ error: 'Missing Required Fields', received: dataInput });
    }

    const cleanUsername = tiktokUsername.replace('@', '').trim();

    const { data, error } = await supabase.rpc('process_auto_topup', {
      p_tiktok_username: cleanUsername,
      p_amount_original: amount,
      p_source: source,
      p_external_id: String(externalId),
      p_rate_multiplier: multiplier
    });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error Detail:", err);
    return res.status(500).json({ error: err.message });
  }
}
