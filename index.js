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
        // 1. Get logs
        const { data: logs, error: logError } = await supabase
            .from('logs')
            .select('twod')
            .order('id', { ascending: false })
            .limit(100);

        if (logError || !logs || logs.length === 0) return;

        // 2. Calculate Top 3 Frequency
        const counts = logs.reduce((acc, log) => {
            acc[log.twod] = (acc[log.twod] || 0) + 1;
            return acc;
        }, {});

        const top3 = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0])
            .join(', ');

        // 3. UPSERT logic (Create if missing, update if exists)
        const { error: upsertError } = await supabase
            .from('broadcast')
            .upsert({ 
                id: 'live_feed', 
                rows: top3, 
                updated_at: new Date().toISOString() 
            }, { onConflict: 'id' });

        if (upsertError) console.error("❌ Upsert Failed:", upsertError.message);
        else console.log(`✅ Broadcast Sync: ${top3}`);

    } catch (err) {
        console.error("❌ System Error:", err.message);
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