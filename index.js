/**
 * 🛡️ SENTINEL v6.5.2 — RENDER-HARDENED CORE
 * Project Reference: Monday Kickoff
 * Strategy: Stealth Neutralized
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Support for Render/Vercel static file paths
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ===============================
   CORE BRAIN
================================ */
async function calculatePredictions(latestTwod) {
  try {
    // 1. Raw Log
    await supabase.from('logs').insert([{ twod: latestTwod }]);

    // 2. Break Calc
    const breakDigit = (Number(latestTwod[0]) + Number(latestTwod[1])) % 10;

    // 3. RPC calls using the 'p_' fixed parameters
    await supabase.rpc('increment_break', { p_break_digit: breakDigit.toString() });
    await supabase.rpc('increment_twod', { p_twod_value: latestTwod });

    // 4. DNA Math
    const front = 42; const back = 54;
    const magnet = [...(front / back).toString().replace('.', '')].reduce((a, b) => a + Number(b), 0) % 10;
    const diff = Math.abs(front - back).toString();
    const offset = Math.abs(Number(diff[0]) - Number(diff[1] || 0));

    // 5. Signal Generation
    const signal = `
📊 MAGNET: ${magnet} | OFFSET: ${offset}
🧮 CURRENT BREAK: ${breakDigit}
🐘 Elephant Gravity: Break 1 (Vacuum)
Status: Sentinel v5.2 standing by for 11:00 AM.
    `.trim();

    await supabase.from('broadcast').upsert({ id: 'live_feed', signal_message: signal, updated_at: new Date() });

    console.log(`✅ SENTINEL PULSE: ${latestTwod}`);
    return signal;
  } catch (err) {
    console.error('🔥 CORE ERROR:', err.message);
    return '⚠️ DEGRADED';
  }
}

/* ===============================
   ROUTES
================================ */
app.get('/api/unified-live', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.thaistock2d.com/live', { timeout: 4500 });
    const bc = await calculatePredictions(data.live.twod);
    res.json({ live: data.live, broadcast: bc });
  } catch (e) {
    res.status(500).json({ error: 'OFFLINE' });
  }
});

app.get('/api/break-stats', async (req, res) => {
  const { data } = await supabase.from('break_stats').select('*').order('break_digit');
  res.json(data || []);
});

app.get('/api/get-broadcast', async (req, res) => {
  const { data } = await supabase.from('broadcast').select('signal_message').eq('id', 'live_feed').single();
  res.json(data || { signal_message: '📡 STANDBY' });
});

// Root Route for Health Check
app.get('/', (req, res) => {
  res.send('🛡️ SENTINEL v6.5.2 ONLINE');
});

/* ===============================
   BOOT (The Render Fix)
================================ */
const PORT = process.env.PORT || 10000;
// We bind to 0.0.0.0 so Render can see the service
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DOCTOR GEM: Sentinel is Live on Port ${PORT}`);
});