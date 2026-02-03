/**
 * 🛡️ SENTINEL v6.5.1 — HARDENED AUTHORITATIVE CORE
 * Optimized for Vercel + Supabase
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Note: Vercel serves the /public folder automatically. 
// This is a fallback for local testing.
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
    // 1. Log Raw Event
    await supabase.from('logs').insert([{ twod: latestTwod }]);

    // 2. Calculate Break Digit
    const breakDigit = (Number(latestTwod[0]) + Number(latestTwod[1])) % 10;

    // 3. Atomic Market Memory (RPC)
    // Using 'p_' prefix to match the fixed SQL functions
    const { error: bErr } = await supabase
      .rpc('increment_break', { p_break_digit: breakDigit.toString() });

    if (bErr) throw new Error(`increment_break → ${bErr.message}`);

    const { error: tErr } = await supabase
      .rpc('increment_twod', { p_twod_value: latestTwod });

    if (tErr) throw new Error(`increment_twod → ${tErr.message}`);

    // 4. DNA Keys (Project Reference: Monday Kickoff)
    const front = 42;
    const back = 54;
    const magnet = [...(front / back).toString().replace('.', '')]
                   .reduce((a, b) => a + Number(b), 0) % 10;

    const diff = Math.abs(front - back).toString();
    const offset = Math.abs(Number(diff[0]) - Number(diff[1] || 0));

    // 5. Fetch Top 10
    const { data: top10 } = await supabase
      .from('twod_stats')
      .select('twod, total_count')
      .order('total_count', { ascending: false })
      .limit(10);

    const top10List = top10?.length ? top10.map(r => r.twod).join(', ') : '—';

    // 6. Authoritative Broadcast
    const signal = `
📊 MAGNET: ${magnet} | OFFSET: ${offset}
🧮 CURRENT BREAK: ${breakDigit}
🏆 TOP 10 FREQUENT: ${top10List}
🐘 Elephant Gravity: Break 1 (Vacuum)
DNA RECALIBRATING... TARGET SEED: 82.50
    `.trim();

    await supabase.from('broadcast').upsert({
      id: 'live_feed',
      signal_message: signal,
      updated_at: new Date()
    });

    console.log(`✅ SENTINEL OK | 2D=${latestTwod}`);
    return signal;

  } catch (err) {
    console.error('🔥 SENTINEL FAILURE:', err.message);
    return '⚠️ SENTINEL DEGRADED — CHECK CORE LOGS';
  }
}

/* ===============================
   API ROUTES
================================ */
app.get('/api/unified-live', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.thaistock2d.com/live', { timeout: 4000 });
    const broadcast = await calculatePredictions(data.live.twod);
    res.json({ live: data.live, broadcast });
  } catch (err) {
    res.status(500).json({ error: 'MARKET FEED LOST' });
  }
});

app.get('/api/break-stats', async (req, res) => {
  const { data } = await supabase.from('break_stats').select('*').order('break_digit');
  res.json(data || []);
});

app.get('/api/get-broadcast', async (req, res) => {
  const { data } = await supabase.from('broadcast').select('signal_message').eq('id', 'live_feed').single();
  res.json(data || { signal_message: '📡 SENTINEL STANDBY' });
});

// Vercel handles the route, but export the app
module.exports = app;