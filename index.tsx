
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Coins, Copy, AlertCircle, Zap, Check, Wallet,
  Database, Github, Server, Activity, Clock, RefreshCcw, Info
} from 'lucide-react';

// === CONFIGURASI WAJIB ===
// Silakan ganti dengan data dari Supabase Dashboard > Settings > API
const SUPABASE_URL = "https://PROJECT_ID_KAMU.supabase.co"; 
const SUPABASE_ANON_KEY = "MASUKKAN_ANON_KEY_KAMU_DISINI";

// Proteksi agar tidak crash jika key belum diisi
const isConfigured = !SUPABASE_URL.includes("PROJECT_ID_KAMU");
const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide' | 'sql' | 'webhooks'>('dashboard');
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const BASE_URL = window.location.origin + "/api/webhook";

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Ambil profile user pertama untuk contoh tampilan
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      setUserProfile(profileData);

      // Ambil log topup terbaru
      const { data: logsData } = await supabase
        .from('topup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setLogs(logsData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured) fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      {!isConfigured && (
        <div className="bg-red-500 text-white p-3 text-center text-xs font-bold animate-pulse">
          ⚠️ SETUP REQUIRED: Masukkan SUPABASE_URL & ANON_KEY di file index.tsx agar data muncul!
        </div>
      )}

      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20 animate-gold">
              <Coins className="text-slate-900 w-5 h-5" />
            </div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">Gold<span className="text-amber-500">Center</span></h1>
          </div>
          <button 
            onClick={fetchData}
            disabled={!isConfigured}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <nav className="flex flex-col gap-2">
            {[
              { id: 'dashboard', label: 'Overview', icon: Wallet },
              { id: 'guide', label: 'Vercel Setup', icon: Github },
              { id: 'sql', label: 'Database SQL', icon: Database },
              { id: 'webhooks', label: 'Webhook URL', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold text-sm transition-all border ${
                  activeTab === tab.id 
                    ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-xl scale-[1.02]' 
                    : 'text-slate-400 bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Status Akun</p>
            {userProfile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Username TikTok</p>
                  <p className="text-sm font-black text-pink-500 italic">@{userProfile.tiktok_username || 'Belum Set'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Saldo Gold</p>
                  <p className="text-2xl font-black text-amber-500">{userProfile.gold_balance.toLocaleString()} G</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Data profile tidak ditemukan di database.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-6">
                  <div className="bg-pink-500/20 p-4 rounded-2xl"><Zap className="text-pink-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">TikTok Live</p>
                    <p className="text-xl font-black italic">1 Koin = 1 Gold</p>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-6">
                  <div className="bg-blue-500/20 p-4 rounded-2xl"><Activity className="text-blue-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">SociaBuzz</p>
                    <p className="text-xl font-black italic">Rp 100 = 1 Gold</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic uppercase tracking-tighter">
                  <Clock className="text-amber-500" /> Real-time Logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase font-black">
                        <th className="pb-2 pl-4">Waktu</th>
                        <th className="pb-2">Dari</th>
                        <th className="pb-2">TikTok ID</th>
                        <th className="pb-2 text-right pr-4">Gold</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {logs.length > 0 ? logs.map((log) => (
                        <tr key={log.id} className="bg-slate-950/50 hover:bg-slate-800 transition-colors">
                          <td className="py-4 pl-4 rounded-l-xl text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-md font-bold uppercase text-[9px] ${
                              log.source === 'tiktok' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {log.source}
                            </span>
                          </td>
                          <td className="py-4 font-bold">@{log.tiktok_username}</td>
                          <td className="py-4 text-right pr-4 rounded-r-xl font-black text-emerald-500">
                            +{log.amount_gold} G
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                            Belum ada transaksi terdeteksi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-black italic uppercase text-amber-500">Panduan Deployment</h3>
              <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                <p>1. Masukkan file <b>package.json</b> dan folder <b>api/</b> ke root repository GitHub kamu.</p>
                <p>2. Hubungkan GitHub ke Vercel.</p>
                <p>3. Di Dashboard Vercel, masuk ke <b>Settings &gt; Environment Variables</b>.</p>
                <p>4. Masukkan <b>SUPABASE_URL</b> dan <b>SUPABASE_SERVICE_ROLE_KEY</b>.</p>
                <p>5. Jalankan SQL di tab sebelah pada Supabase SQL Editor.</p>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Copy SQL to Supabase</h3>
                  <button 
                    onClick={() => copyToClipboard(`
-- TABEL UNTUK LOG TRANSAKSI
CREATE TABLE IF NOT EXISTS topup_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text UNIQUE,
  source text,
  tiktok_username text,
  amount_gold bigint,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- FUNGSI OTOMATIS TOPUP
CREATE OR REPLACE FUNCTION process_auto_topup(
  p_tiktok_username text,
  p_amount_original float8,
  p_source text,
  p_external_id text,
  p_rate_multiplier float8
)
RETURNS json AS $$
DECLARE
  v_gold_to_add bigint;
  v_user_id uuid;
BEGIN
  v_gold_to_add := floor(p_amount_original * p_rate_multiplier);

  IF EXISTS (SELECT 1 FROM topup_logs WHERE external_id = p_external_id) THEN
    RETURN json_build_object('success', false, 'message', 'Duplicate Trans');
  END IF;

  SELECT id INTO v_user_id FROM profiles 
  WHERE LOWER(tiktok_username) = LOWER(p_tiktok_username) OR LOWER(username) = LOWER(p_tiktok_username)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User Not Found');
  END IF;

  UPDATE profiles SET gold_balance = gold_balance + v_gold_to_add WHERE id = v_user_id;

  INSERT INTO topup_logs (external_id, source, tiktok_username, amount_gold)
  VALUES (p_external_id, p_source, p_tiktok_username, v_gold_to_add);

  RETURN json_build_object('success', true, 'gold_added', v_gold_to_add);
END;
$$ LANGUAGE plpgsql;`, 'sql')}
                    className="bg-amber-500 text-slate-900 px-4 py-2 rounded-xl text-xs font-black hover:scale-105 transition-all"
                  >
                    {copied === 'sql' ? 'COPIED!' : 'COPY SQL'}
                  </button>
               </div>
               <pre className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono text-emerald-500 border border-slate-800 overflow-x-auto">
                 {`-- Jalankan ini di SQL Editor Supabase
-- Pastikan tabel profiles sudah punya kolom gold_balance (bigint)`}
               </pre>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
                <h3 className="font-black text-pink-500">TikFinity URL (GET)</h3>
                <div className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono border border-slate-800 break-all pr-10 relative">
                  {BASE_URL}?nickname={"{nickname}"}&coins={"{coins}"}
                  <button onClick={() => copyToClipboard(`${BASE_URL}?nickname={nickname}&coins={coins}`, 'tk')} className="absolute right-2 top-2 p-1.5 bg-slate-800 rounded-lg">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
                <h3 className="font-black text-blue-500">SociaBuzz URL (POST)</h3>
                <div className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono border border-slate-800 break-all pr-10 relative">
                  {BASE_URL}
                  <button onClick={() => copyToClipboard(BASE_URL, 'sb')} className="absolute right-2 top-2 p-1.5 bg-slate-800 rounded-lg">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
