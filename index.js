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

  // 🔥 DIRECT WRITE — NO LOCK, NO RPC, NO CONDITIONS
  const { error } = await supabase
    .from('break_stats')
    .upsert({
      break_digit: breakDigit,
      total_count: 999
    });

  if (error) {
    console.error('🔥 HARD WRITE FAILED:', error);
  } else {
    console.log('✅ HARD WRITE OK:', breakDigit);
  }

  await supabase.from('broadcast').update({
    signal_message: `🔥 FORCE WRITE OK — BREAK ${breakDigit}`,
    updated_at: new Date()
  }).eq('id', 'live_feed');

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