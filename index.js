/**
 * 🛡️ SENTINEL v6.5.5 — CLEAN, CRASH-PROOF, MANUAL-LOCK READY
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------
// Supabase client
// -----------------------
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// -----------------------
// SAFE PREDICTIONS FUNCTION
// -----------------------
async function calculatePredictions(twod) {
  const breakDigit = (Number(twod[0]) + Number(twod[1])) % 10;

  // 1️⃣ Log event
  await supabase.from('break_logs').insert({
    live_2d: twod,
    break_value: breakDigit,
    is_hit: null,
    constant_used: 'sentinel_v6'
  });

  // 2️⃣ Increment break_stats safely
  const { error } = await supabase.rpc('increment_break', { break_digit: breakDigit });
  if (error) console.error('❌ increment_break failed:', error);
  else console.log('✅ break incremented:', breakDigit);

  // 3️⃣ Update broadcast if not locked
  const signal = `🎯 Target Focus: BREAK ${breakDigit}`;
  const { data: bc } = await supabase
    .from('broadcast')
    .select('manual_lock')
    .eq('id','live_feed')
    .maybeSingle();

  if (!bc?.manual_lock) {
    await supabase.from('broadcast').update({
      signal_message: signal,
      updated_at: new Date()
    }).eq('id','live_feed');
  }

  return breakDigit;
}

// -----------------------
// UNIFIED LIVE ENDPOINT
// -----------------------
app.get('/api/unified-live', async (req, res) => {
  try {
    // 1️⃣ Get live 2D from Thai API
    const { data: live } = await axios.get('https://api.thaistock2d.com/live', { timeout: 4000 });

    // 2️⃣ Calculate predictions & write logs/stats
    const breakDigit = await calculatePredictions(live.live.twod);

    // 3️⃣ Get broadcast text
    const { data: bc } = await supabase
      .from('broadcast')
      .select('signal_message')
      .eq('id','live_feed')
      .maybeSingle();

    // 4️⃣ Get break stats
    const { data: stats } = await supabase
      .from('break_stats')
      .select('*')
      .order('break_digit');

    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.json({
      live: live.live,
      broadcast: bc?.signal_message || '📡 STANDBY',
      stats,
      breakDigit
    });
  } catch (e) {
    console.error('❌ /api/unified-live failed:', e.message);
    res.status(500).json({ error:'OFFLINE' });
  }
});

// -----------------------
// SIMPLE HEALTH CHECK
// -----------------------
app.get('/', (_, res) => res.send('🛡️ SENTINEL v6.5.5 ONLINE'));

// -----------------------
// START SERVER
// -----------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 SENTINEL ACTIVE ON ${PORT}`));