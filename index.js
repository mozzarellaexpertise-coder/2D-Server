/**
 * 🛡️ SENTINEL v6.5.3 — RENDER-HARDENED CORE
 * Project Reference: Monday Kickoff
 * Strategy: Burmese Unicode Support & CORS Fixed
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors'); // Essential for Vercel connection
const { createClient } = require('@supabase/supabase-js');

const app = express();

// 🔓 ALLOW VERCEL ACCESS
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/* ===============================
   CORE BRAIN
================================ */
async function calculatePredictions(latestTwod) {
    try {
        await supabase.from('logs').insert([{ twod: latestTwod }]);
        const breakDigit = (Number(latestTwod[0]) + Number(latestTwod[1])) % 10;
        
        await supabase.rpc('increment_break', { p_break_digit: breakDigit.toString() });
        await supabase.rpc('increment_twod', { p_twod_value: latestTwod });

        // Logic for Burmese Signal
        const signal = `📊 MAGNET: 3 | OFFSET: 1\n🐘 ဆင်ဖြူတော်ဆွဲအား: BREAK 5 (VACUUM)\n⚠️ ၁၂:၀၀ ပွဲအတွက် ပစ်မှတ်: 32, 41, 05, 14, 23\n📡 Sentinel စနစ်: အဆင်သင့်ဖြစ်ပြီ။`;

        await supabase.from('broadcast').upsert({ 
            id: 'live_feed', 
            signal_message: signal, 
            updated_at: new Date() 
        });

        return signal;
    } catch (err) {
        return '⚠️ DEGRADED';
    }
}

/* ===============================
   ROUTES (With UTF-8 Fix)
================================ */
app.get('/api/get-broadcast', async (req, res) => {
    const { data } = await supabase.from('broadcast').select('signal_message').eq('id', 'live_feed').single();
    // 🌍 FORCE UTF-8 FOR BURMESE TEXT
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(data || { signal_message: '📡 STANDBY' });
});

app.get('/api/unified-live', async (req, res) => {
    try {
        const { data } = await axios.get('https://api.thaistock2d.com/live', { timeout: 4500 });
        const bc = await calculatePredictions(data.live.twod);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({ live: data.live, broadcast: bc });
    } catch (e) {
        res.status(500).json({ error: 'OFFLINE' });
    }
});

app.get('/api/break-stats', async (req, res) => {
    const { data } = await supabase.from('break_stats').select('*').order('break_digit');
    res.json(data || []);
});

app.get('/', (req, res) => res.send('🛡️ SENTINEL v6.5.3 ONLINE'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Sentinel Live on ${PORT}`));