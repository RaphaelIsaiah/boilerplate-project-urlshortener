require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { isWebUri } = require("valid-url");
const shortid = require("shortid");

const app = express();
const port = process.env.PORT || 3000;
let db;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use("/public", express.static(`${process.cwd()}/public`));

// MongoDB Connection
async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("url_shortener");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails
  }
}
connectDB();

// Routes
app.get("/", (req, res) => {
  res.sendFile(`${process.cwd()}/views/index.html`);
});

app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;

  if (!isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }

  try {
    const shortUrl = shortid.generate();
    await db.collection("urls").insertOne({
      original_url: url,
      short_url: shortUrl,
    });
    res.json({ original_url: url, short_url: shortUrl });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  try {
    const { short_url } = req.params;
    const doc = await db.collection("urls").findOne({ short_url });

    if (doc) {
      res.redirect(doc.original_url);
    } else {
      res.status(404).json({ error: "short url not found" });
    }
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
