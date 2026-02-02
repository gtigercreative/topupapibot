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

    // LOG UNTUK NGINTIP DATA DI VERCEL DASHBOARD
    console.log("--- DATA MASUK ---");
    console.log(JSON.stringify(dataInput, null, 2));

    const webhookSecret = process.env.WEBHOOK_SECRET;
    const incomingToken = req.headers['x-sociabuzz-token'] || dataInput?.webhook_token || req.query?.token;

    if (webhookSecret && incomingToken !== webhookSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mapping field dari Indofinity
    const tiktokUsername = dataInput.username || dataInput.nickname;
    const amount = parseFloat(dataInput.coins) || 0;

    if (!tiktokUsername || amount <= 0) {
      return res.status(200).json({ status: "skipped", reason: "missing fields", data: dataInput });
    }

    const { data, error } = await supabase.rpc('process_auto_topup', {
      p_tiktok_username: tiktokUsername.replace('@', '').trim(),
      p_amount_original: amount,
      p_source: 'tiktok',
      p_external_id: String(dataInput.msgId || Date.now()),
      p_rate_multiplier: 1
    });

    if (error) throw error;
    return res.status(200).json(data);

  } catch (err) {
    console.error("Runtime Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
