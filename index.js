const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// === MONGODB CONFIGURATION (The Mango Fruits) ===
const MONGO_URI = process.env.MONGO_URI; // Set this in EvenNode Environment Vars
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to Cloud Mango Vault (MongoDB)"))
    .catch(err => console.error("❌ Mango Connection Error:", err));

// === SCHEMAS (Replacing CREATE TABLE) ===
const History = mongoose.model('History', {
    draw_date: String,
    slot: String,
    set_idx: String,
    val_input: String,
    anchor: String,
    constant: String,
    created_at: { type: Date, default: Date.now }
});

const MarketTick = mongoose.model('MarketTick', {
    tick_time: String,
    set_index: Number,
    value_index: Number,
    live_2d: String,
    created_at: { type: Date, default: Date.now, expires: 43200 } // Auto-delete after 12 hours (43200s)
});

// --- API: LOG-TICK (5s OPTIMIZED) ---
app.post('/api/log-tick', async (req, res) => {
    const { set, value, twod, timestamp } = req.body;
    if (set === undefined || value === undefined) return res.status(400).send("No Data");

    try {
        const newTick = new MarketTick({ set_index: set, value_index: value, live_2d: twod, tick_time: timestamp });
        await newTick.save();
        console.log(`📡 [${new Date().toLocaleTimeString()}] Mango Tick: ${twod}`);
        res.sendStatus(200);
    } catch (err) {
        res.status(503).send("Elephant Blocked (Mango Busy)");
    }
});

// --- API: LOAD PREDICTION DATA (3 MOST POSSIBLE ROWS) ---
app.get('/load', async (req, res) => {
    const { draw_date, slot } = req.query;
    try {
        let query = {};
        if (draw_date && slot) query = { draw_date, slot };
        
        // Fetching with "3 most possible rows" logic in mind
        const results = await History.find(query).sort({ _id: -1 }).limit(1);
        res.send(results[0] || {});
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- API: FETCH TICK HISTORY (FOR LISA'S CHART) ---
app.get('/api/history', async (req, res) => {
    try {
        const rows = await MarketTick.find().sort({ _id: -1 }).limit(100);
        res.json(rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log('💎 DR. G - MANGO ENGINE 5.5 [EUROPE]');
    console.log(`🚀 Node Version: ${process.version}`);
    console.log('-------------------------------------------');
});