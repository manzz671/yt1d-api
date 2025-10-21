const express = require('express');
const { yt1d } = require('../lib/yt1d');
const app = express();
app.use(express.json());

app.post('/analyze', async (req, res) => {
  try {
    const result = await yt1d.analyze(req.body.url);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/convert', async (req, res) => {
  try {
    const result = await yt1d.convert(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/bypass', async (req, res) => {
  try {
    const token = await yt1d.bypass();
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ yt1d REST API aktif di port', process.env.PORT || 3000);
});
