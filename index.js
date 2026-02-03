/**
 * 🛡️ SENTINEL v6.5.4 — SINGLE ORACLE CORE
 * DB = SOURCE OF TRUTH
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ===============================
   CORE LOGIC
================================ */
async function calculatePredictions(twod) {
  const breakDigit = (Number(twod[0]) + Number(twod[1])) % 10;

  await supabase.rpc('increment_break', {
    p_break_digit: breakDigit.toString()
  });

  const signal =
`📊 MAGNET: 3 | OFFSET: 1
🐘 Double Twin Scan: ${twod}
⚠️ သတိ: အလှည့်အပြောင်း စတင်လာပါပြီ
🎯 Target Focus: BREAK ${breakDigit}
📡 Sentinel: LOCKED`;

  await supabase.from('broadcast').upsert({
    id: 'live_feed',
    signal_message: signal,
    updated_at: new Date()
  });

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

// 🔎 Check if manual override is active
const { data: bc } = await supabase
  .from('broadcast')
  .select('manual_lock')
  .eq('id', 'live_feed')
  .single();

// ✍️ Only auto-write if NOT manually locked
if (!bc?.manual_lock) {
  await supabase.from('broadcast').upsert({
    id: 'live_feed',
    signal_message: signal,
    updated_at: new Date()
  });
}

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
    res.status(500).json({ error:'OFFLINE' });
  }
});

app.get('/', (_,res)=>res.send('🛡️ SENTINEL ONLINE'));

const PORT = process.env.PORT || 10000;
app.listen(PORT,'0.0.0.0',()=>console.log('🚀 SENTINEL ACTIVE'));