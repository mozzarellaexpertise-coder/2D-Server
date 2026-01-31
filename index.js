/**
 * 🛡️ SENTINEL v6.4 — MARKET MEMORY ENABLED
 * Break Totals | 2D Intelligence | Authoritative Broadcast
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
   CORE LOGIC — SENTINEL BRAIN
================================ */
async function calculatePredictions(latestTwod) {
  try {
    /* 1️⃣ LOG RAW EVENT */
    await supabase.from('logs').insert([{ twod: latestTwod }]);

    /* 2️⃣ BREAK DIGIT (AUTHORITATIVE) */
    const breakDigit =
      (Number(latestTwod[0]) + Number(latestTwod[1])) % 10;

    /* 3️⃣ UPDATE MARKET MEMORY (RPC — ATOMIC) */
    await supabase.rpc('increment_break', { b: breakDigit });
    await supabase.rpc('increment_twod', { t: latestTwod });

    /* 4️⃣ DNA KEY CALCULATION (42.54 SEED) */
    const front = 42;
    const back = 54;

    const magnet =
      [...(front / back).toString().replace('.', '')]
        .reduce((a, b) => a + Number(b), 0) % 10;

    const diff = Math.abs(front - back).toString();
    const offset = Math.abs(
      Number(diff[0]) - Number(diff[1] || 0)
    );

    /* 5️⃣ TOP 10 MOST FREQUENT 2D */
    const { data: top10 } = await supabase
      .from('twod_stats')
      .select('twod, total_count')
      .order('total_count', { ascending: false })
      .limit(10);

    const top10List = top10?.length
      ? top10.map(r => r.twod).join(', ')
      : '—';

    /* 6️⃣ CONSTRUCT BROADCAST MESSAGE */
    const burmeseAlert =
      "🐘 Elephant Gravity: Break 1 (Vacuum) အား အထူးဂရုပြုပါ။ DNA Keys မျှခြေပြန်ရှာနေသည်။";

    const signalMessage = `
📊 MAGNET: ${magnet} | OFFSET: ${offset}
🧮 CURRENT BREAK: ${breakDigit}

🏆 TOP 10 MOST FREQUENT 2D:
${top10List}

${burmeseAlert}
`.trim();

    /* 7️⃣ UPSERT BROADCAST (AUTHORITATIVE) */
    const { error } = await supabase
      .from('broadcast')
      .upsert({
        id: 'live_feed',
        signal_message: signalMessage,
        updated_at: new Date()
      });

    if (error) {
      console.error("❌ BROADCAST WRITE ERROR:", error.message);
    } else {
      console.log(
        `✅ SIGNAL SYNCED | 2D=${latestTwod} | BREAK=${breakDigit}`
      );
    }

    return signalMessage;

  } catch (err) {
    console.error("🔥 SENTINEL CORE FAILURE:", err.message);
    return "⚠️ SENTINEL DEGRADED — MARKET MEMORY ERROR";
  }
}

/* ===============================
   ROUTES
================================ */

/**
 * 🔴 LIVE BRIDGE
 * Fetch → Calculate → Persist → Broadcast → Respond
 */
app.get('/api/unified-live', async (_, res) => {
  try {
    const { data } = await axios.get(
      'https://api.thaistock2d.com/live'
    );

    const live = data.live;
    const broadcast = await calculatePredictions(live.twod);

    res.json({
      live,
      broadcast
    });

  } catch (err) {
    console.error("🌉 BRIDGE ERROR:", err.message);
    res.status(500).json({
      error: "BRIDGE CONNECTION LOST"
    });
  }
});

/**
 * 📡 BROADCAST FALLBACK (OBS SAFE)
 */
app.get('/api/get-broadcast', async (_, res) => {
  try {
    const { data } = await supabase
      .from('broadcast')
      .select('signal_message')
      .eq('id', 'live_feed')
      .single();

    res.json(data || {
      signal_message: "📡 SYNCHRONIZING WITH SENTINEL VAULT..."
    });

  } catch {
    res.json({
      signal_message: "📡 SYNCHRONIZING WITH SENTINEL VAULT..."
    });
  }
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
   SERVER BOOT
================================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🛡️ SENTINEL v6.4 ACTIVE → PORT ${PORT}`);
});
