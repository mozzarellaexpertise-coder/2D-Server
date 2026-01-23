const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ---- MONGOOSE CONNECT ----
mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log("✅ Connected to Cloud Mango Vault"))
  .catch(err => console.error("❌ Mango Error:", err.message));

// ---- SCHEMAS ----
const HistorySchema = new mongoose.Schema({
  draw_date: String, slot: String, set_idx: String, val_input: String
}, { timestamps: true });

const MarketTick = mongoose.model('MarketTick', new mongoose.Schema({
  set_index: Number, value_index: Number, live_2d: String, tick_time: String,
  created_at: { type: Date, default: Date.now, index: { expires: 43200 } }
}));

const History = mongoose.model('History', HistorySchema);

// ---- UI SERVING ----
// This serves the HTML directly from the server root
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>PONNAR SENTINEL v1.1</title>
  <style>
    :root { --neon: #22ffcc; --bg: #020617; }
    body { background: var(--bg); color: #fff; font-family: monospace; text-align: center; padding: 20px; }
    .glow { font-size: 5rem; color: var(--neon); text-shadow: 0 0 20px rgba(34,255,204,0.6); }
    .card { background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 12px; margin: 10px auto; max-width: 400px; }
    .row { font-size: 1.8rem; color: var(--neon); letter-spacing: 5px; margin: 5px; }
    .alert { background: #e11d48; padding: 10px; border-radius: 8px; display: none; }
  </style>
</head>
<body>
  <h1>PONNAR SENTINEL v1.1</h1>
  <div id="lock-alert" class="alert">🐘 ELEPHANT LOCK ACTIVE</div>
  <div class="card">
    <div id="live-2d" class="glow">--</div>
    <div id="status">PULSE: CONNECTING...</div>
  </div>
  <div class="card">
    <h3>TOP 3 PREDICTIONS</h3>
    <div id="prediction-list"></div>
  </div>
  <p style="font-size:0.7rem; color:#475569;">Formula: $Target = \\text{decimal}(\\frac{V}{S} \\times \\frac{100}{3})$</p>

  <script>
    async function update() {
      try {
        const res = await fetch('/load');
        const data = await res.json();
        if(!data.val_input) return;

        document.getElementById('live-2d').innerText = data.val_input.toString().slice(-2);
        document.getElementById('status').innerText = "VAULT OK: " + new Date().toLocaleTimeString();

        // Engine A: Tail-Gate Logic
        const v = parseFloat(data.val_input.replace(/,/g, ''));
        const s = parseFloat(data.set_idx);
        if(v && s) {
          const seed = ((v / s) * 100 / 3).toFixed(4);
          const tail = seed.split('.')[1];
          const rows = [tail.substring(0,2), tail.substring(1,3), tail.substring(2,4)];
          document.getElementById('prediction-list').innerHTML = 
            rows.map(r => '<div class="row">'+r+'</div>').join('');
        }
      } catch(e) { document.getElementById('status').innerText = "OFFLINE"; }
    }
    setInterval(update, 2000);
    update();
  </script>
</body>
</html>
  `);
});

// ---- API ROUTES ----
app.get('/load', async (req, res) => {
  try {
    const result = await History.findOne().sort({ _id: -1 });
    res.json(result || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/log-tick', async (req, res) => {
  try {
    const { set_index, value_index, twod, timestamp } = req.body;
    await MarketTick.create({ set_index, value_index, live_2d: twod, tick_time: timestamp });
    res.sendStatus(200);
  } catch (err) { res.status(503).send("Elephant Blocked"); }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// ---- START ----
app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('MANGO ENGINE 5.5 [DIRECT UI MODE]');
  console.log('-------------------------------------------');
});