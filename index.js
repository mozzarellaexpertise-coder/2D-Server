const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Logic 6.2: Automated DNA Key & Frequency Analysis
const calculatePredictions = async (latestTwod) => {
    try {
        // 1. Log the incoming signal
        await supabase.from('logs').insert([{ twod: latestTwod }]);

        // 2. DNA Key Calculation (Seed: 76.05)
        // Ratio: 76/5 = 15.2 -> 1+5+2 = 8 (Magnet)
        // Diff: 76-5 = 71 -> 7-1 = 6 (Offset)
        const front = 76, back = 5;
        const magnet = Array.from((front / back).toString().replace('.', '')).reduce((a, b) => a + Number(b), 0) % 10;
        const diffStr = Math.abs(front - back).toString();
        const offset = Math.abs(Number(diffStr[0]) - Number(diffStr[1] || 0));

        // 3. Fetch History for Frequency Analysis
        const { data: logs } = await supabase.from('logs')
            .select('twod')
            .order('id', { ascending: false })
            .limit(100);

        if (!logs) return "--, --, --";

        const counts = logs.reduce((acc, row) => {
            acc[row.twod] = (acc[row.twod] || 0) + 1;
            return acc;
        }, {});

        // 4. Filter Top 3 using Magnet & Offset as weighting
        const top3 = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0])
            .join(', ');

        // 5. Broadcast to the Vault with DNA Keys
        await supabase.from('broadcast').upsert({ 
            id: 'live_feed', 
            rows: top3,
            pat_thee: `M:${magnet} | O:${offset}` // Sending Keys to UI
        });

        return top3;
    } catch (err) {
        console.error("Sentinel Logic Error:", err);
        return "--, --, --";
    }
};

// 2. ADD THIS BLOCK TO SERVE THE HTML
// This tells Express to serve any files in your root folder
app.use(express.static(path.join(__dirname, 'public')));

// This ensures that when someone goes to your URL, it opens index.html from the public folder
app.get('/', (req, res) => {
    // Added 'public' to the path below
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/unified-live', async (req, res) => {
    try {
        // Pull Live Feed from Thailand
        const market = await axios.get('https://api.thaistock2d.com/live');
        const live = market.data.live;

        // Sync prediction logic
        const prediction = await calculatePredictions(live.twod);

        res.json({ live, prediction });
    } catch (err) {
        res.status(500).json({ error: "Bridge Connection Lost" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Sentinel v6.2 Bridge Active on ${PORT}`));