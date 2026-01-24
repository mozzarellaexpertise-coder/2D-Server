// ------------------- PONNAR SENTINEL v1.5.1 (SUPABASE BROADCAST) -------------------
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- 📊 THE CALCULATION ENGINE (3 MOST POSSIBLE ROWS) ---
const updateBroadcast = async () => {
    try {
        // 1. Get the last 200 logs to calculate frequency
        const { data: logs } = await supabase
            .from('logs')
            .select('twod')
            .order('id', { ascending: false })
            .limit(200);

        if (!logs || logs.length === 0) return;

        // 2. Logic: P(n) = f(n) / sum f(i)
        const counts = logs.reduce((acc, log) => {
            acc[log.twod] = (acc[log.twod] || 0) + 1;
            return acc;
        }, {});

        // 3. Get Top 3
        const top3 = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0])
            .join(', ');

        // 4. Update the Broadcast table
        await supabase
            .from('broadcast')
            .update({ 
                rows: top3, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', 'live_feed');

        console.log(`✅ Broadcast Updated: [${top3}]`);
    } catch (err) {
        console.error("❌ Broadcast Error:", err.message);
    }
};

// --- API: LOG-TICK (Optimized for your 'logs' table) ---
app.post('/api/log-tick', async (req, res) => {
    const { set, value, twod, timestamp } = req.body;
    
    const { error } = await supabase
        .from('logs')
        .insert([{ 
            set_index: set, 
            market_value: value, 
            twod: twod, 
            recorded_at: timestamp 
        }]);

    if (error) return res.status(503).send("Vault Busy");

    // Trigger prediction update every tick
    updateBroadcast();

    res.sendStatus(200);
});

// --- API: FETCH LIVE BROADCAST (For your Website) ---
app.get('/api/live', async (req, res) => {
    const { data, error } = await supabase
        .from('broadcast')
        .select('*')
        .eq('id', 'live_feed')
        .single();

    if (error) return res.status(500).json(error);
    res.json(data);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log('💎 PONNAR SENTINEL v1.5.1 [SUPABASE LIVE]');
    console.log(`🚀 Primary URL: https://twod-server-f4df.onrender.com`);
    console.log('-------------------------------------------');
});