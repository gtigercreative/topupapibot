
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log(`[${req.method}] Incoming Webhook at ${new Date().toISOString()}`);

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const dataInput = req.method === 'GET' ? req.query : req.body;
    
    let tiktokUsername = '';
    let amount = 0;
    let source = '';
    let externalId = '';
    let multiplier = 1;

    // 1. TIKFINITY
    if (dataInput.coins || dataInput.gift_name) {
      source = 'tiktok';
      tiktokUsername = dataInput.nickname || dataInput.uniqueId || dataInput.username;
      amount = parseFloat(dataInput.coins) || 0;
      externalId = dataInput.msgId || `tk_${Date.now()}`;
      multiplier = 1; 
    } 
    // 2. SOCIABUZZ
    else if (dataInput.voter_name || dataInput.amount) {
      source = 'sociabuzz';
      tiktokUsername = dataInput.voter_name; 
      amount = parseFloat(dataInput.amount) || 0;
      externalId = dataInput.transaction_id || `sb_${Date.now()}`;
      multiplier = 0.01; // Rp 100 = 1 Gold
    }

    if (!tiktokUsername || amount <= 0) {
      return res.status(400).json({ error: 'Invalid Data', received: dataInput });
    }

    const cleanUsername = tiktokUsername.replace('@', '').trim();

    // Eksekusi RPC
    const { data, error } = await supabase.rpc('process_auto_topup', {
      p_tiktok_username: cleanUsername,
      p_amount_original: amount,
      p_source: source,
      p_external_id: String(externalId),
      p_rate_multiplier: multiplier
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[SUCCESS] Added ${data.gold_added} Gold to ${cleanUsername}`);
    return res.status(200).json(data);

  } catch (err) {
    console.error('API Handler Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
