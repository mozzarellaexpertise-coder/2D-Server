/**
 * 🛡️ SENTINEL v6.5 — HARDENED AUTHORITATIVE CORE
 */

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ===============================
   SUPABASE CLIENT
================================ */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ===============================
   CORE BRAIN
================================ */
async function calculatePredictions(latestTwod) {
  try {
    /* 1️⃣ LOG RAW EVENT */
    await supabase.from('logs').insert([{ twod: latestTwod }]);

    /* 2️⃣ BREAK DIGIT */
    const breakDigit =
      (Number(latestTwod[0]) + Number(latestTwod[1])) % 10;

    /* 3️⃣ ATOMIC MARKET MEMORY */
    const { error: bErr } = await supabase
      .rpc('increment_break', { break_digit: breakDigit });

    if (bErr) throw new Error(`increment_break → ${bErr.message}`);

    const { error: tErr } = await supabase
      .rpc('increment_twod', { twod_value: latestTwod });

    if (tErr) throw new Error(`increment_twod → ${tErr.message}`);

    /* 4️⃣ DNA KEYS */
    const front = 42;
    const back = 54;

    const magnet =
      [...(front / back).toString().replace('.', '')]
        .reduce((a, b) => a + Number(b), 0) % 10;

    const diff = Math.abs(front - back).toString();
    const offset = Math.abs(
      Number(diff[0]) - Number(diff[1] || 0)
    );

    /* 5️⃣ TOP 10 */
    const { data: top10 } = await supabase
      .from('twod_stats')
      .select('twod, total_count')
      .order('total_count', { ascending: false })
      .limit(10);

    const top10List = top10?.length
      ? top10.map(r => r.twod).join(', ')
      : '—';

    /* 6️⃣ BROADCAST */
    const signal = `
📊 MAGNET: ${magnet} | OFFSET: ${offset}
🧮 CURRENT BREAK: ${breakDigit}

🏆 TOP 10 MOST FREQUENT 2D:
${top10List}

🐘 Elephant Gravity: Break 1 (Vacuum)
DNA balance recalibrating…
`.trim();

    await supabase
      .from('broadcast')
      .upsert({
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
   ROUTES
================================ */
app.get('/api/unified-live', async (_, res) => {
  try {
    const { data } = await axios.get(
      'https://api.thaistock2d.com/live',
      { timeout: 5000 }
    );

    const live = data.live;
    const broadcast = await calculatePredictions(live.twod);

    res.json({ live, broadcast });

  } catch (err) {
    console.error('🌉 BRIDGE DOWN:', err.message);
    res.status(500).json({ error: 'MARKET FEED LOST' });
  }
});

/* 🔍 AUTHORITATIVE BREAK GRID */
app.get('/api/break-stats', async (_, res) => {
  const { data } = await supabase
    .from('break_stats')
    .select('*')
    .order('break_digit');

  res.json(data || []);
});

/* 📡 BROADCAST SAFE */
app.get('/api/get-broadcast', async (_, res) => {
  const { data } = await supabase
    .from('broadcast')
    .select('signal_message')
    .eq('id', 'live_feed')
    .single();

  res.json(data || {
    signal_message: '📡 SENTINEL STANDBY'
  });
});

/* ===============================
   FRONTEND
================================ */
app.get('/', (_, res) => {
  res.sendFile(
    path.join(__dirname, 'public', 'index.html')
  );
});

/* ===============================
   BOOT
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🛡️ SENTINEL v6.5 LIVE → ${PORT}`)
);
