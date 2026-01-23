// ------------------- PONNAR SENTINEL v1.3 -------------------
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false
  })
);

// 🔒 LOCK TO EVENNODE HOST (CHANGE IF YOU ADD CUSTOM DOMAIN)
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (!host.includes('kogat.eu-4.evennode.com')) {
    return res.status(403).send('🚫 Forbidden Host');
  }
  next();
});

// ------------------- CONFIG -------------------
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

console.log('🌱 MONGO_URI:', MONGO_URI ? 'SET' : 'MISSING');

// ------------------- MONGOOSE -------------------
mongoose.connect(MONGO_URI, {
  autoIndex: false
})
.then(() => console.log('✅ Connected to Cloud Mango Vault'))
.catch(err => {
  console.error('❌ Mango Error:', err.message);
  process.exit(1);
});

// ------------------- SCHEMAS -------------------
const HistorySchema = new mongoose.Schema({
  draw_date: { type: String, required: true },
  slot:      { type: String, required: true },
  set_idx:   { type: String, required: true },
  val_input: { type: String, required: true }
}, { timestamps: true });

const MarketTickSchema = new mongoose.Schema({
  set_index:   { type: Number, required: true },
  value_index: { type: Number, required: true },
  live_2d:     { type: String, required: true },
  tick_time:   { type: String }
}, { timestamps: true });

const History    = mongoose.model('History', HistorySchema);
const MarketTick = mongoose.model('MarketTick', MarketTickSchema);

// ------------------- ROUTES -------------------

// UI
app.get('/', (req, res) => {
  res.send('<h1>PONNAR SENTINEL v1.3 🦏</h1><p>Status: ONLINE</p>');
});

// LOAD LATEST HISTORY
app.get('/load', async (req, res) => {
  try {
    const last = await History.findOne().sort({ _id: -1 }).lean();
    res.json(last || {});
  } catch (err) {
    console.error('LOAD ERROR:', err.message);
    res.status(500).json({ error: 'load-failed' });
  }
});

// INSERT HISTORY
app.post('/api/history', async (req, res) => {
  try {
    console.log('📦 HISTORY BODY:', req.body);

    const { draw_date, slot, set_idx, val_input } = req.body;
    if (!draw_date || !slot || !set_idx || !val_input) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const doc = await History.create({
      draw_date,
      slot,
      set_idx,
      val_input
    });

    console.log('📝 HISTORY INSERTED:', doc._id);
    res.sendStatus(200);

  } catch (err) {
    console.error('🐘 HISTORY ERROR:', err.message);
    res.status(500).json({ error: 'insert-failed' });
  }
});

// INSERT MARKET TICK
app.post('/api/log-tick', async (req, res) => {
  try {
    console.log('📦 TICK BODY:', req.body);

    const { set_index, value_index, twod, timestamp } = req.body;
    if (set_index == null || value_index == null || !twod) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const doc = await MarketTick.create({
      set_index,
      value_index,
      live_2d: twod,
      tick_time: timestamp
    });

    console.log('📊 TICK INSERTED:', doc._id);
    res.sendStatus(200);

  } catch (err) {
    console.error('🐘 TICK ERROR:', err.message);
    res.status(503).json({ error: 'tick-failed' });
  }
});

// HEALTH
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState,
    time: Date.now()
  });
});

// ------------------- START -------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('🦏 PONNAR SENTINEL v1.3 — EVENNODE LOCKED');
  console.log(`🌐 https://kogat.eu-4.evennode.com`);
  console.log(`🚀 PORT ${PORT}`);
  console.log('-------------------------------------------');
});