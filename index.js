require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGODB_URI);
let db;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db("url_shortener");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// Call when the server starts
connectDB();

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
// app.get("/api/hello", function (req, res) {
//   res.json({ greeting: "hello API" });
// });

// URL validation with valid-url
const { isWebUri } = require("valid-url");

app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }

  res.json({ original_url: url, short_url: 1 }); // Temporary mock
});

// Generate Short IDs with shortid
const shortid = require("shortid");

app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;

  if (!isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }

  const shortUrl = shortid.generate(); // e.g "abc123"
  await db
    .collection("urls")
    .insertOne({ original_url: url, short_url: shortUrl });

  res.json({ original_url: url, short_url: shortUrl });
});

// Redirect short urls
app.get("api/shorturl/:shorturl", async (req, res) => {
  const { short_url } = req.params;
  const doc = await db.collection("urls").findOne({ short_url });

  if (doc) {
    res.redirect(doc.original_url);
  } else {
    res.json({ error: "url not found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
