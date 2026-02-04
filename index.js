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

  // 🧠 LOG EVENT (optional but good)
  await supabase.from('break_logs').insert({
    live_2d: twod,
    break_value: breakDigit,
    is_hit: null,
    constant_used: 'sentinel_v6'
  });

  // ✅ SINGLE, SAFE INCREMENT
  const { error } = await supabase.rpc('increment_break', {
    break_digit: breakDigit
  });

  if (error) {
    console.error('❌ increment_break failed:', error);
  } else {
    console.log('✅ break incremented:', breakDigit);
  }

  // 🛡️ Broadcast (lock-aware)
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

/* ===============================
   SIMPLE HEALTH CHECK
================================ */
app.get('/', (_, res) => res.send('🛡️ SENTINEL v6.5.5 ONLINE'));

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT,'0.0.0.0',()=>console.log(`🚀 SENTINEL ACTIVE ON ${PORT}`));