/**
 * 🛡️ SENTINEL v6.5.5 — CRASH-PROOF, MANUAL-LOCK READY
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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/* ===============================
   SAFE PREDICTIONS
================================ */
async function calculatePredictions(twod) {
  const breakDigit = (Number(twod[0]) + Number(twod[1])) % 10;

  // 🚑 EMERGENCY WRITE — THIS WAS MISSING
  await supabase.from('break_logs').insert({
    live_2d: twod,
    break_value: breakDigit,
    is_hit: null,
    constant_used: 'sentinel_v6'
  });

  await supabase.rpc('increment_break', {
    break_digit: breakDigit
  });

  const signal = 
`📊 MAGNET: 3 | OFFSET: 1
🐘 Double Twin Scan: ${twod}
⚠️ သတိ: အလှည့်အပြောင်း စတင်လာပြီ
🎯 Target Focus: BREAK ${breakDigit}
📡 Sentinel: LOCKED`;

  const { data: bc } = await supabase
    .from('broadcast')
    .select('manual_lock')
    .eq('id','live_feed')
    .maybeSingle();

  if (!bc?.manual_lock) {
    await supabase.from('broadcast').upsert({
      id: 'live_feed',
      signal_message: signal,
      updated_at: new Date()
    });
  }

  return breakDigit;
}

/* ===============================
   UNIFIED LIVE ENDPOINT
================================ */
app.get('/api/unified-live', async (req, res) => {
  try {
    const { data: live } = await axios.get(
      'https://api.thaistock2d.com/live',
      { timeout: 4000 }
    );

    const breakDigit = await calculatePredictions(live.live.twod);

    const { data: bc } = await supabase
      .from('broadcast')
      .select('signal_message')
      .eq('id','live_feed')
      .maybeSingle();

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

/* ===============================
   SIMPLE HEALTH CHECK
================================ */
app.get('/', (_, res) => res.send('🛡️ SENTINEL v6.5.5 ONLINE'));

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT,'0.0.0.0',()=>console.log(`🚀 SENTINEL ACTIVE ON ${PORT}`));