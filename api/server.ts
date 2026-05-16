import express from "express";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { MongoClient, ServerApiVersion } from 'mongodb';

// MongoDB Client Logic Inlined for Vercel Compatibility
const uri = process.env.MONGODB_URI;
let mongoClient: MongoClient | null = null;
let cachedDb: any = null;

if (uri) {
  mongoClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 90000,
    maxPoolSize: 100,
    minPoolSize: 10,
    maxIdleTimeMS: 60000,
    heartbeatFrequencyMS: 10000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
}

let connectionPromise: Promise<any> | null = null;

let lastDbError: string | null = null;

const getDb = async () => {
  if (!mongoClient) return null;
  
  if (cachedDb) return cachedDb;
  
  if (!connectionPromise) {
    connectionPromise = mongoClient.connect()
      .then(() => {
        console.log("MongoDB connected successfully");
        cachedDb = mongoClient.db("aset_app");
        lastDbError = null;
        return cachedDb;
      })
      .catch(e => {
        console.error("Database connection failure:", e);
        lastDbError = e.message;
        connectionPromise = null;
        cachedDb = null;
        return null;
      });
  }
  
  return connectionPromise;
};

/**
 * Executes a DB operation with automatic retries for transient errors
 */
async function withDb(req: any, res: any, operation: (db: any) => Promise<any>) {
  let lastError: any;
  for (let i = 0; i < 3; i++) {
    const db = await getDb();
    if (!db) {
      lastError = new Error("Could not establish database connection");
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      continue;
    }
    
    try {
      return await operation(db);
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message.toLowerCase();
      const isTransient = 
        errorMessage.includes("timeout") || 
        errorMessage.includes("interrupted") || 
        errorMessage.includes("topology") ||
        errorMessage.includes("not connected") ||
        errorMessage.includes("closed");

      if (isTransient) {
        console.warn(`Transient DB error: ${error.message}. Retrying (${i + 1}/3)...`);
        cachedDb = null; // Invalidate cache to force reconnect if necessary
        connectionPromise = null; // Force a new connection attempt
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      // Non-transient error, throw immediately
      throw error;
    }
  }
  
  if (lastError) {
    console.error("DB Operation failed after retries:", lastError);
    res.status(500).json({ error: lastError.message || "Database operation failed after multiple attempts" });
  }
}

// Load firebase config manually
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.warn("Failed to load firebase-applet-config.json via fs:", e);
}

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
let firebaseApp: admin.app.App;
try {
  if (firebaseConfig.projectId) {
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("Firebase Admin initialized for project:", firebaseConfig.projectId);
    } else {
      firebaseApp = admin.app();
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging (MUST be before routes)
app.use((req, res, next) => {
  const start = Date.now();
  if (req.originalUrl.startsWith("/api/")) {
    console.log(`${new Date().toISOString()} - [API START] ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${new Date().toISOString()} - [API END] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

// Set request timeout (to avoid hanging connections)
app.use((req, res, next) => {
  res.setTimeout(120000, () => {
    console.error(`Request timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(504).json({ error: "Gateway Timeout", message: "Server took too long to respond" });
    }
  });
  next();
});

// Health Check for Debugging
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    mongodb_client: !!mongoClient, 
    firebase: !!firebaseApp,
    db_connected: !!cachedDb,
    last_db_error: lastDbError,
    vercel: !!process.env.VERCEL,
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Request logging (for debugging fall-through)
app.use("/api/*", (req, res, next) => {
  // If we reached here, it means no specific API route matched
  next();
});

// Migration Endpoint
app.post("/api/migrate-to-mongodb", async (req, res) => {
  await withDb(req, res, async (db) => {
    const { collectionName, documents } = req.body;
    const docsToInsert = documents.map((doc: any) => ({
      ...doc,
      _id: doc.id || doc._id,
      migratedAt: new Date(),
      source: "firestore"
    }));
    await db.collection(collectionName).deleteMany({});
    if (docsToInsert.length > 0) {
      const result = await db.collection(collectionName).insertMany(docsToInsert);
      res.json({ count: result.insertedCount });
    } else {
      res.json({ count: 0 });
    }
  });
});

// MongoDB Generic API
app.get("/api/mongodb/:collection", async (req, res) => {
  await withDb(req, res, async (db) => {
    const { orderBy, orderDir, limit, where, search } = req.query;
    
    let filter: any = {};
    if (search) {
      const searchStr = search as string;
      const searchRegex = { $regex: searchStr, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { outlet: searchRegex },
        { placement: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
        { verifier: searchRegex },
        { ownership: searchRegex },
        { condition: searchRegex },
        { status: searchRegex }
      ];
    }

    if (where) {
      try {
        const whereClauses = Array.isArray(where) ? where : [where];
        whereClauses.forEach((w: any) => {
          const { field, operator, value } = JSON.parse(w as string);
          if (operator === '==' || operator === '===') {
            filter[field] = value;
          } else if (operator === '>=') {
            filter[field] = { $gte: value };
          } else if (operator === '<=') {
            filter[field] = { $lte: value };
          } else if (operator === '>') {
            filter[field] = { $gt: value };
          } else if (operator === '<') {
            filter[field] = { $lt: value };
          } else if (operator === 'array-contains') {
            filter[field] = { $in: [value] };
          }
        });
      } catch (e) {
        console.error("Error parsing where filter:", e);
      }
    }

    let queryBuilder = db.collection(req.params.collection).find(filter);
    if (orderBy) {
      const dir = orderDir === 'desc' ? -1 : 1;
      queryBuilder = queryBuilder.sort({ [orderBy as string]: dir });
    }
    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit as string));
    }
    const docs = await queryBuilder.toArray();
    res.json(docs);
  });
});

app.get("/api/mongodb/:collection/:id", async (req, res) => {
  await withDb(req, res, async (db) => {
    const doc = await db.collection(req.params.collection).findOne({ _id: req.params.id as any });
    res.json(doc);
  });
});

app.post("/api/mongodb/:collection", async (req, res) => {
  await withDb(req, res, async (db) => {
    const data = req.body;
    if (data.id && !data._id) data._id = data.id;
    const result = await db.collection(req.params.collection).insertOne(data);
    res.json({ id: result.insertedId, ...data });
  });
});

app.put("/api/mongodb/:collection/:id", async (req, res) => {
  await withDb(req, res, async (db) => {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    await db.collection(req.params.collection).updateOne(
      { _id: req.params.id as any },
      { $set: updateData }
    );
    res.json({ success: true });
  });
});

app.delete("/api/mongodb/:collection/:id", async (req, res) => {
  await withDb(req, res, async (db) => {
    await db.collection(req.params.collection).deleteOne({ _id: req.params.id as any });
    res.json({ success: true });
  });
});

// Fonnte WhatsApp
app.post("/api/whatsapp", async (req, res) => {
  const { target, message } = req.body;
  const token = process.env.FONNTE_TOKEN || "D29H1kvj4usxSjdsUMD5";
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ target, message }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "whatsapp_failed" });
  }
});

async function startServer() {
  // Initial MongoDB connection attempt
  const db = await getDb();
  if (db) {
    console.log("MongoDB connection established on startup");
  }

  // API 404 handler - Catch unhandled API requests before Vite/Static
  app.use("/api/:path*", (req: any, res: any) => {
    console.warn(`API Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "API route not found", path: req.params.path });
  });

  // Vite middleware for development
  let viteMiddleware: any = null;
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      viteMiddleware = vite.middlewares;
      app.use(viteMiddleware);
      console.log("Vite middleware loaded");
    } catch (e) {
      console.error("Failed to load Vite middleware:", e);
      // Fallback: try to serve static files if they exist
    }
  } 
  
  if (!viteMiddleware && !process.env.VERCEL) {
    // Production static files or fallback if Vite failed
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) return next(); // Don't serve index.html for API
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("Serving static files from dist");
    } else {
      app.get("/", (req, res) => {
        res.send("<h1>Server is running</h1><p>API is available at /api/health. Application bundle (dist) not found and Vite failed to start.</p>");
      });
    }
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  // Global error handler - MUST be at the very bottom
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("CRITICAL SERVER ERROR:", err);
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || 500;
    if (req.path.startsWith("/api/")) {
      res.status(status).json({ 
        error: "Internal Server Error", 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    } else {
      next(err);
    }
  });
}

startServer().catch(console.error);

export default app;
