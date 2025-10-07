import 'dotenv/config';
import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion, ObjectId} from 'mongodb';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use(express.static(join(__dirname, 'public')));

// const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI; 
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Keep the connection open for our CRUD operations
let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("games"); // Database name
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
connectDB();



app.get('/', (req, res) => {
  res.send('<h3>Welcome to the Game Library!</h3><a href="gamelibrary">Visit Your Game Library!</a><br>')
})



app.get('/gamelibrary', (req, res) => {
 
  res.sendFile(join(__dirname, 'public', 'game.html')) 

})

// CRUD ENDPOINTS FOR VIDEO GAMES IN A LIBRARY

// CREATE -- ADD A NEW GAME

app.post('/api/games', async (req, res) => {
  try {
    //console.log(req.body);
    const { title, platform , status = 'Backlog', notes = '' } = req.body;
    console.log (title); 
    
    // Simple validation
    if (!title || !platform) {
      return res.status(400).json({ error: 'Title and Platform are required' });
    }

    const game = { title, platform, status, notes };
    const result = await db.collection('games').insertOne(game);
    
    res.status(201).json({ 
      message: 'Game created successfully',
      gameId: result.insertedId,
      game: { ...game, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game: ' + error.message });
  }

});

// READ - Get all games

app.get('/api/games', async (req, res) => {
  try {
    const games = await db.collection('games').find({}).toArray();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games: ' + error.message});
  }
});

// UPDATE - Update a game by ID

app.put('/api/games/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {title, platform, status, notes} = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (platform) updateData.platform = platform;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    console.log(updateData);

    const result = await db.collection('games').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Game not found'});
    }
    res.json({
      message: 'Game updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update game: ' + error.message});
  }
      });
      
// DELETE - Delete a game by ID
app.delete('/api/games/:id', async (req, res) => {
  try {
    const {id} = req.params;

    if(!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }
    const result = await db.collection('games').deleteOne({_id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json ({
      message: 'Game deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game: ' + error.message });
  }
});

// SEED - Add sample games
app.post('/api/seed', async (req, res) => {
  try {
    // clear existing data
    await db.collection('games').deleteMany({});

    const sampleGames = [
      { title: "Elden Ring", platform: "PS5", status: "Backlog", notes: "Start a strength build" },
      { title: "The Legend of Zelda: TOTK", platform: "Switch", status: "Playing", notes: "Finish the Depths" },
      { title: "Hades", platform: "PC", status: "Completed", notes: "20 heat clear next" },
      { title: "Starfield", platform: "Xbox", status: "Abandoned", notes: "Might revisit later" },
      { title: "Stardew Valley", platform: "PC", status: "Playing", notes: "Year 2 spring" }
    ];
    const result = await db.collection('games').insertMany(sampleGames);

    res.json({
      message: `Database seeded successfully! Added ${result.insertedCount} sample games.`,
      insertedCount: result.insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database: ' + error.message });
  }
});

// CLEANUP - Remove ALL game data
app.delete('/api/cleanup', async (req, res) => {
  try {
    const result = await db.collection('games').deleteMany({});

    res.json({
      message: `Database cleaned successfully! Removed ${result.deletedCount} games.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup database: ' + error.message });
  }
});

app.listen(PORT, () => {
});

