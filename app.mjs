
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ---- Mongo ----
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db, games;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("backlog");           // database name
    games = db.collection("games");      // collection name
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}
connectDB();

// ---- Routes ----
app.get('/', (_req, res) => {
  res.send('<h3>Welcome to the Game Backlog!</h3><a href="backlog">Open Game Backlog</a><br>');
});

app.get('/backlog', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'game-CRUD.html'));
});

// ---- CRUD: /api/games ----

// CREATE
app.post('/api/games', async (req, res) => {
  try {
    const { title, platform, status = 'Backlog', notes = '' } = req.body;
    if (!title || !platform) {
      return res.status(400).json({ error: 'Title and Platform are required' });
    }
    const doc = { title, platform, status, notes };
    const result = await games.insertOne(doc);
    res.status(201).json({ message: 'Game created', gameId: result.insertedId, game: { ...doc, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create: ' + err.message });
  }
});

// READ all
app.get('/api/games', async (_req, res) => {
  try {
    const list = await games.find().sort({ _id: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch: ' + err.message });
  }
});

// READ one
app.get('/api/games/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const game = await games.findOne({ _id });
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json(game);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id: ' + err.message });
  }
});

// UPDATE
app.put('/api/games/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const { title, platform, status, notes } = req.body;
    const update = {
      ...(title !== undefined && { title }),
      ...(platform !== undefined && { platform }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    };
    const result = await games.findOneAndUpdate({ _id }, { $set: update }, { returnDocument: 'after' });
    if (!result.value) return res.status(404).json({ error: 'Not found' });
    res.json(result.value);
  } catch (err) {
    res.status(400).json({ error: 'Update failed: ' + err.message });
  }
});

// DELETE
app.delete('/api/games/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const result = await games.deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Delete failed: ' + err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
