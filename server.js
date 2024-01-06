const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb'); // Add ObjectId from mongodb
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = 3000;

// Ensure the 'videos' directory exists
async function ensureVideosDirectoryExists() {
    const videosDirectory = path.join(__dirname, 'videos');

    try {
        await fs.access(videosDirectory);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(videosDirectory);
        } else {
            throw err;
        }
    }
}

ensureVideosDirectoryExists();

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'videos/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// MongoDB connection string
const mongoURI = 'mongodb://127.0.0.1:27017/records'; // Update with your database name
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/upload', upload.single('video'), async (req, res) => {
    try {
        const videoUrl = `/videos/${req.file.filename}`;

        // Store the video URL in MongoDB and get the ObjectId
        const objectId = await storeVideoUrlInMongoDB(videoUrl);

        res.json({ message: 'Video uploaded successfully', videoUrl, objectId });
    } catch (error) {
        console.error('Error handling video upload:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/storeVideoUrl', async (req, res) => {
    try {
        console.log('Received request to store video URL');

        const { videoUrl, timestamp } = req.body;

        // Connect to MongoDB and store the video URL
        await client.connect();

        const database = client.db('records');
        const collection = database.collection('videos');

        const result = await collection.insertOne({
            videoUrl,
            timestamp
        });

        console.log('Inserted video URL with id:', result.insertedId);
        res.status(201).json({ message: 'Video URL stored successfully', objectId: result.insertedId });
    } catch (error) {
        console.error('Error storing video URL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close(); // Close the MongoDB connection after processing
    }
});

async function storeVideoUrlInMongoDB(videoUrl) {
    try {
        // Connect to MongoDB and store the video URL
        await client.connect();

        const database = client.db('records');
        const collection = database.collection('videos');

        const result = await collection.insertOne({
            videoUrl,
            timestamp: new Date()
        });

        console.log('Inserted video URL with id:', result.insertedId);
        return result.insertedId; // Return the ObjectId
    } catch (error) {
        console.error('Error storing video URL:', error);
        throw error;
    } finally {
        await client.close(); // Close the MongoDB connection after processing
    }
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
