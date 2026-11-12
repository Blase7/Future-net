require('dotenv').config();
require('dotenv').config({ path: '/etc/secrets/.env' }); // Render "Secret Files" location, ignored if missing
const path = require('path');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI;
if (!uri) {
  console.error('Missing MONGODB_URI. Put it in .env locally, or in Render > Environment.');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (q, s) => s.send('ok'));

const wrap = fn => (q, s) => fn(q, s).catch(e => {
  console.error(e);
  s.status(500).json({ error: 'Server error' });
});

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(process.env.MONGO_DB || 'bankroll');
  await db.command({ ping: 1 });
  console.log('MongoDB connected');

  for (const k of ['goals', 'entries']) {
    const col = db.collection(k);
    app.get('/api/' + k, wrap(async (q, s) => s.json(await col.find().sort({ date: -1, _id: -1 }).toArray())));
    app.post('/api/' + k, wrap(async (q, s) => {
      const { _id, ...b } = q.body || {};
      const d = { ...b, created: new Date() };
      await col.insertOne(d);
      s.json(d);
    }));
    app.put('/api/' + k + '/:id', wrap(async (q, s) => {
      if (!ObjectId.isValid(q.params.id)) return s.status(400).json({ error: 'Bad id' });
      const { _id, ...b } = q.body || {};
      await col.updateOne({ _id: new ObjectId(q.params.id) }, { $set: b });
      s.json({ ok: 1 });
    }));
    app.delete('/api/' + k + '/:id', wrap(async (q, s) => {
      if (!ObjectId.isValid(q.params.id)) return s.status(400).json({ error: 'Bad id' });
      await col.deleteOne({ _id: new ObjectId(q.params.id) });
      s.json({ ok: 1 });
    }));
  }

  const cfg = db.collection('settings');
  app.get('/api/settings', wrap(async (q, s) => s.json((await cfg.findOne({ _id: 'main' })) || {})));
  app.put('/api/settings', wrap(async (q, s) => {
    const { _id, ...b } = q.body || {};
    await cfg.replaceOne({ _id: 'main' }, b, { upsert: true });
    s.json({ ok: 1 });
  }));

  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Running on port ' + port));
}

main().catch(e => {
  console.error('Could not start:', e.message);
  process.exit(1);
});
