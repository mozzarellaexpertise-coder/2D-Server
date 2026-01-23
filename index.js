const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI NOT SET — check EvenNode env vars");
  process.exit(1);
}

// ---- MONGOOSE CONNECT ----
mongoose.connect(MONGO_URI, {
  autoIndex: true
})
.then(() => console.log("✅ Connected to Cloud Mango Vault (MongoDB)"))
.catch(err => {
  console.error("❌ Mango Connection Error:", err.message);
  process.exit(1);
});

// ---- CONNECTION HEALTH ----
mongoose.connection.on('disconnected', () => {
  console.warn("⚠️ Mango disconnected");
});
mongoose.connection.on('error', err => {
  console.error("❌ Mango runtime error:", err);
});

// ---- SCHEMAS ----
const HistorySchema = new mongoose.Schema({
  draw_date: String,
  slot: String,
  set_idx: String,
  val_input: String,
  anchor: String,
  constant: String
}, { timestamps: { createdAt: 'created_at' } });

const MarketTickSchema = new mongoose.Schema({
  tick_time: String,
  set_index: Number,
  value_index: Number,
  live_2d: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: { expires: 43200 } // 12 hours
  }
});

const History = mongoose.model('History', HistorySchema);
const MarketTick = mongoose.model('MarketTick', MarketTickSchema);

// ---- API: LOG TICK ----
app.post('/api/log-tick', async (req, res) => {
  const { set_index, value_index, twod, timestamp } = req.body;

  if (set_index === undefined || value_index === undefined) {
    return res.status(400).send("No Data");
  }

  try {
    await MarketTick.create({
      set_index,
      value_index,
      live_2d: twod,
      tick_time: timestamp
    });

    console.log(`📡 Mango Tick: ${twod}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Tick insert failed:", err.message);
    res.status(503).send("Elephant Blocked (Mango Busy)");
  }
});

// ---- API: LOAD ----
app.get('/load', async (req, res) => {
  const { draw_date, slot } = req.query;

  try {
    const query = draw_date && slot ? { draw_date, slot } : {};
    const result = await History.findOne(query).sort({ _id: -1 });
    res.json(result || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- API: HISTORY ----
app.get('/api/history', async (req, res) => {
  try {
    const rows = await MarketTick.find()
      .sort({ _id: -1 })
      .limit(100)
      .lean();

    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- START ----
app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('MANGO ENGINE 5.5 [EUROPE]');
  console.log(`🚀 Node Version: ${process.version}`);
  console.log('-------------------------------------------');
});
