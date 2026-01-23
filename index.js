// ------------------- PONNAR SENTINEL v1.2 (EVENNODE BEAST) -------------------
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

// 🔥 Disable CSP (INLINE UI SAFE)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

// ------------------- CONFIG -------------------
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ------------------- MONGOOSE CONNECT -------------------
mongoose.connect(MONGO_URI, {
  autoIndex: false,
})
.then(() => console.log("✅ Connected to Cloud Mango Vault"))
.catch(err => console.error("❌ Mango Error:", err.message));

// ------------------- SCHEMAS -------------------
const HistorySchema = new mongoose.Schema({
  draw_date: String,
  slot: String,
  set_idx: String,
  val_input: String
}, { timestamps: true });

const MarketTickSchema = new mongoose.Schema({
  set_index: Number,
  value_index: Number,
  live_2d: String,
  tick_time: String,
  created_at: { type: Date, default: Date.now }
});

const History = mongoose.model('History', HistorySchema);
const MarketTick = mongoose.model('MarketTick', MarketTickSchema);

// ------------------- UI ROUTE -------------------
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>PONNAR SENTINEL v1.2</title>
  <style>
    :root { --neon:#22ffcc; --bg:#020617; }
    body { background:var(--bg); color:#fff; font-family:monospace; text-align:center; padding:20px; }
    .glow { font-size:5rem; color:var(--neon); text-shadow:0 0 20px rgba(34,255,204,.6); }
    .card { background:#1e293b; border:1px solid #334155; padding:20px; border-radius:12px; margin:10px auto; max-width:420px; }
    .row { font-size:1.8rem; color:var(--neon); letter-spacing:6px; margin:6px; }
    .alert { background:#e11d48; padding:10px; border-radius:8px; display:none; }
  </style>
</head>
<body>

<h1>PONNAR SENTINEL v1.2</h1>
<div id="lock-alert" class="alert">🐘 ELEPHANT LOCK ACTIVE</div>

<div class="card">
  <div id="live-2d" class="glow">--</div>
  <div id="status">PULSE: INIT...</div>
</div>

<div class="card">
  <h3>TOP 3 PREDICTIONS</h3>
  <div id="prediction-list"></div>
</div>

<p style="font-size:0.7rem;color:#475569;">
Formula: (V / S) × 100 ÷ 3
</p>

<script>
async function update() {
  try {
    const res = await fetch('/load', { cache: 'no-store' });
    const data = await res.json();
    if (!data || !data.val_input) return;

    const live = data.val_input.toString().slice(-2);
    document.getElementById('live-2d').innerText = live;
    document.getElementById('status').innerText =
      "VAULT OK @ " + new Date().toLocaleTimeString();

    const v = parseFloat(data.val_input.replace(/,/g,''));
    const s = parseFloat(data.set_idx);

    if (v && s) {
      const seed = ((v / s) * 100 / 3).toFixed(4);
      const tail = seed.split('.')[1] || '0000';

      const rows = [
        tail.slice(0,2),
        tail.slice(1,3),
        tail.slice(2,4)
      ];

      document.getElementById('prediction-list').innerHTML =
        rows.map(r => '<div class="row">'+r+'</div>').join('');
    }
  } catch (e) {
    console.error(e);
    document.getElementById('status').innerText = "OFFLINE";
  }
}

update();
setInterval(update, 2000);
</script>

</body>
</html>
`);
});

// ------------------- API ROUTES -------------------
app.get('/load', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ status: 'db-not-ready' });
    }

    const last = await History.findOne().sort({ _id: -1 }).lean();
    res.json(last || {});
  } catch (err) {
    console.error('LOAD ERROR:', err.message);
    res.json({ error: 'load-failed' });
  }
});

app.post('/api/log-tick', async (req, res) => {
  try {
    const { set_index, value_index, twod, timestamp } = req.body;
    if (set_index == null || value_index == null || !twod) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    await MarketTick.create({
      set_index,
      value_index,
      live_2d: twod,
      tick_time: timestamp
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('🐘 Elephant Blocked:', err);
    res.sendStatus(503);
  }
});

// ------------------- HEALTH -------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// ------------------- START -------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('🦏 MANGO ENGINE 5.5 — EVENNODE BEAST MODE');
  console.log(`🌐 PORT ${PORT}`);
  console.log('-------------------------------------------');
});