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
app.use(express.static(path.join(__dirname, "public")));

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

    // Check if request is from a social media crawler
    const isSocialMediaBot =
      req.headers["user-agent"]?.includes("facebookexternalhit") ||
      req.headers["user-agent"]?.includes("Twitterbot") ||
      req.headers["user-agent"]?.includes("LinkedInBot");

    if (isSocialMediaBot) {
      // Serve HTML with OG tags for social media previews
      return res.send(`
  <!DOCTYPE html>
  <html prefix="og: https://ogp.me/ns#">
  <head>
    <title>Short URL: ${short_url}</title>
    <meta property="og:title" content="Short URL Redirect">
    <meta property="og:description" content="Redirecting to: ${
      doc.original_url
    }">
    <meta property="og:url" content="${req.protocol}://${req.get(
        "host"
      )}/api/shorturl/${short_url}">
    <meta property="og:image" content="https://i.postimg.cc/xCMm6Vj5/URL-Shortener-Microservice-Large.png">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="URL Shortener Microservice">
    <meta name="twitter:card" content="summary_large_image">
    <meta http-equiv="refresh" content="0;url=${doc.original_url}">
  </head>
  <body>
    <p>Redirecting to <a href="${doc.original_url}">${doc.original_url}</a></p>
  </body>
  </html>
`);
    } else {
      // Normal user/browser request - redirect immediately
      return res.redirect(doc.original_url);
    }
  } catch (err) {
    console.error("Redirect error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// Shutdown Handler
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
