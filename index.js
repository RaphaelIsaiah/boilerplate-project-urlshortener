// Dependency imports
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { isWebUri } = require("valid-url");
const shortid = require("shortid");
const path = require("path");

// Server setup
const app = express();
const port = process.env.PORT || 3000;
let db;
let dbClient; // Track the client for proper cleanup
let isDBConnected = false;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use("/public", express.static(path.join(__dirname, "public")));

// Database Connection
async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
    });

    await client.connect();
    db = client.db("url_shortener");
    dbClient = client; // Store client reference
    isDBConnected = true;
    console.log("✅ MongoDB Connected!");
    return db;
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
    throw err; // Re-throw to be caught in startup
  }
}

// Database Ready Middleware
app.use((req, res, next) => {
  if (!isDBConnected) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "Database initializing. Please try again shortly.",
    });
  }
  next();
});

// ---- Routes ----

// Homepage (GET /)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Shorten URL (POST /api/shorturl)
app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;

  // ===== 1. Validate URL Format =====
  if (!isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }

  // ===== 2. DNS Lookup Verification =====
  let hostname;
  try {
    // Extract hostname from URL (e.g. "google.com" from "https://google.com/search")
    hostname = new URL(url).hostname;
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  try {
    // Verify domain exists in real DNS records
    await require("dns").promises.lookup(hostname);
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  // ===== 3. Create Short URL =====
  try {
    const shortUrl = shortid.generate();

    await db.collection("urls").insertOne({
      original_url: url,
      short_url: shortUrl,
      createdAt: new Date(),
    });

    res.json({
      original_url: url,
      short_url: shortUrl,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// Redirect Short URL (GET /api/shorturl/:short_url)
app.get("/api/shorturl/:short_url", async (req, res) => {
  try {
    const { short_url } = req.params;
    const doc = await db.collection("urls").findOne({ short_url });

    if (!doc) {
      return res.status(404).json({ error: "not found" });
    }

    res.redirect(doc.original_url);
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// Graceful Shutdown Handler
process.on("SIGTERM", async () => {
  if (dbClient) {
    await dbClient.close();
    console.log("MongoDB connection closed");
  }
  process.exit(0);
});

// Server Startup Sequence
(async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("💥 Fatal startup error:", err);
    process.exit(1);
  }
})();
