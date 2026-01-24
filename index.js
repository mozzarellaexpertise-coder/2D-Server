// ------------------- PONNAR SENTINEL v1.4 (SUPABASE EDITION) -------------------
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));

// ------------------- SUPABASE CONFIG -------------------
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
);

// ------------------- ROUTES -------------------

// UI
app.get('/', (req, res) => {
    res.send('<h1>PONNAR SENTINEL v1.4 🦏</h1><p>Database: SUPABASE (Postgres)</p><p>Status: ONLINE</p>');
});

// 📊 PREDICTION LOGIC: 3 MOST POSSIBLE ROWS
app.get('/api/predictions', async (req, res) => {
    try {
        // SQL Logic: Group by val_input, count frequency, sort by highest, limit to 3
        const { data, error } = await supabase
            .from('history')
            .select('val_input')
            .order('val_input', { ascending: false });

        if (error) throw error;

        // Note: Supabase JS select doesn't do "Group By" directly well without a View,
        // so we process the 'Current Logic' here as requested.
        const counts = data.reduce((acc, item) => {
            acc[item.val_input] = (acc[item.val_input] || 0) + 1;
            return acc;
        }, {});

        const top3 = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([num, freq]) => ({
                number: num,
                probability: `${((freq / data.length) * 100).toFixed(2)}%`,
                frequency: freq
            }));

        res.json({
            success: true,
            formula: "P(n) = f(n) / total",
            top_rows: top3
        });
    } catch (err) {
        res.status(500).json({ error: 'prediction-failed', details: err.message });
    }
});

// INSERT HISTORY (POSTGRES VERSION)
app.post('/api/history', async (req, res) => {
    const { draw_date, slot, set_idx, val_input } = req.body;
    const { data, error } = await supabase
        .from('history')
        .insert([{ draw_date, slot, set_idx, val_input }]);

    if (error) return res.status(500).json(error);
    res.sendStatus(200);
});

// HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'ok', engine: 'Supabase', time: Date.now() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log('🦏 PONNAR SENTINEL v1.4 — SUPABASE MIGRATED');
    console.log(`🚀 PORT ${PORT}`);
    console.log('-------------------------------------------');
});