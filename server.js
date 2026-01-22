const express = require('express');
const app = express();
// EvenNode provides the port via environment variable
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World! 2D Prediction Server is Online.');
});

app.get('/test123', (req, res) => {
  res.json({
    status: "success",
    message: "Endpoint 123 is active",
    data: [1, 2, 3],
    node_version: process.version
  });
});

// To this:
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});