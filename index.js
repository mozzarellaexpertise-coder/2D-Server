/**
 * 🛡️ SENTINEL v6.3 — UNIFIED SIGNAL BRIDGE
 * Authoritative Broadcast | Supabase Synced | Race-Proof
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
   SUPABASE CLIENT (SERVER)
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
    /* 1️⃣ LOG INCOMING SIGNAL */
    await supabase.from('logs').insert([
      { twod: latestTwod }
    ]);

    /* 2️⃣ DNA KEY CALCULATION (Seed 42.54) */
    const front = 42;
    const back = 54;

    const magnet =
      [...(front / back).toString().replace('.', '')]
        .reduce((a, b) => a + Number(b), 0) % 10;

    const diff = Math.abs(front - back).toString();
    const offset = Math.abs(
      Number(diff[0]) - Number(diff[1] || 0)
    );

    /* 3️⃣ FREQUENCY ANALYSIS (LAST 100) */
    const { data: logs, error: logErr } = await supabase
      .from('logs')
      .select('twod')
      .order('id', { ascending: false })
      .limit(100);

    if (logErr) throw logErr;

    const freq = {};
    logs.forEach(r => {
      freq[r.twod] = (freq[r.twod] || 0) + 1;
    });

    const top3 = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    /* 4️⃣ CONSTRUCT BROADCAST MESSAGE */
    const burmeseAlert =
      "🐘 Elephant Gravity: Break 1 (Vacuum) အား အထူးဂရုပြုပါ။ DNA Keys မျှခြေပြန်ရှာနေသည်။";

    const signalMessage = `
📊 MAGNET: ${magnet} | OFFSET: ${offset}
🔝 TOP 3: ${top3.length ? top3.join(', ') : '--'}

${burmeseAlert}
`.trim();

    /* 5️⃣ UPSERT BROADCAST (AUTHORITATIVE) */
    const { data, error } = await supabase
      .from('broadcast')
      .upsert({
        id: 'live_feed',
        signal_message: signalMessage,
        updated_at: new Date()
      })
      .select();

    if (error) {
      console.error("❌ BROADCAST WRITE FAILED:", error.message);
    } else {
      console.log("✅ BROADCAST SYNCED:", data);
    }

    return signalMessage;

  } catch (err) {
    console.error("🔥 SENTINEL CORE ERROR:", err.message);
    return "⚠️ SENTINEL ERROR — SIGNAL DEGRADED";
  }
}

/* ===============================
   ROUTES
================================ */

/**
 * 🔴 PRIMARY LIVE BRIDGE
 * Fetch → Calculate → Broadcast → Respond
 */
app.get('/api/unified-live', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://api.thaistock2d.com/live'
    );

    const live = data.live;
    const message = await calculatePredictions(live.twod);

    // 🔑 Return BOTH — no frontend race condition
    res.json({
      live,
      broadcast: message
    });

  } catch (err) {
    console.error("🌉 BRIDGE FAILURE:", err.message);
    res.status(500).json({
      error: "BRIDGE CONNECTION LOST"
    });
  }
});

/**
 * 📡 BROADCAST FALLBACK (OBS / PANEL SAFE)
 */
app.get('/api/get-broadcast', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broadcast')
      .select('signal_message')
      .eq('id', 'live_feed')
      .single();

    if (error) throw error;

    res.json(data);

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
  console.log(`🛡️ SENTINEL v6.3 ACTIVE → PORT ${PORT}`);
});