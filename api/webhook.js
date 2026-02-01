
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  // Ambil token dari mana saja (TikFinity di query, SociaBuzz di header/body)
  const incomingToken = req.headers['x-sociabuzz-token'] || req.body?.webhook_token || req.query?.token;

  // Verifikasi Keamanan
  if (webhookSecret && incomingToken !== webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Security Token' });
  }

  try {
    const dataInput = req.method === 'GET' ? req.query : req.body;
    
    let tiktokUsername = '';
    let amount = 0;
    let source = '';
    let externalId = '';
    let multiplier = 1;

    // DETEKSI TIKFINITY
    if (dataInput.coins || dataInput.gift_name) {
      source = 'tiktok';
      tiktokUsername = dataInput.nickname || dataInput.uniqueId || dataInput.username;
      amount = parseFloat(dataInput.coins) || 0;
      externalId = dataInput.msgId || `tk_${Date.now()}`;
      multiplier = 1; // 1 Koin = 1 Gold
    } 
    // DETEKSI SOCIABUZZ
    else if (dataInput.voter_name || dataInput.amount) {
      source = 'sociabuzz';
      tiktokUsername = dataInput.voter_name; 
      amount = parseFloat(dataInput.amount) || 0;
      externalId = dataInput.transaction_id || `sb_${Date.now()}`;
      multiplier = 0.01; // Rp 100 = 1 Gold
    }

    if (!tiktokUsername || amount <= 0) {
      return res.status(400).json({ error: 'Missing Required Fields' });
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
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
