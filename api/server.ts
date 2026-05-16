import express from "express";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { MongoClient, ServerApiVersion } from 'mongodb';

// MongoDB Client Logic Inlined for Vercel Compatibility
const uri = process.env.MONGODB_URI;
let mongoClient: MongoClient | null = null;

if (uri) {
  mongoClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
}

async function connectDB() {
  if (!mongoClient) return null;
  try {
    await mongoClient.connect();
    console.log("Successfully connected to MongoDB!");
    return mongoClient;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return null;
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

// Health Check for Debugging
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    mongodb: !!mongoClient, 
    firebase: !!firebaseApp,
    vercel: !!process.env.VERCEL,
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("CRITICAL SERVER ERROR:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});


// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Migration Endpoint
app.post("/api/migrate-to-mongodb", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  const { collectionName, documents } = req.body;
  try {
    const db = mongoClient.db("aset_app");
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MongoDB Generic API
app.get("/api/mongodb/:collection", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  try {
    const db = mongoClient.db("aset_app");
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/mongodb/:collection/:id", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  try {
    const db = mongoClient.db("aset_app");
    const doc = await db.collection(req.params.collection).findOne({ _id: req.params.id as any });
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/mongodb/:collection", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  try {
    const db = mongoClient.db("aset_app");
    const data = req.body;
    if (data.id && !data._id) data._id = data.id;
    const result = await db.collection(req.params.collection).insertOne(data);
    res.json({ id: result.insertedId, ...data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/mongodb/:collection/:id", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  try {
    const db = mongoClient.db("aset_app");
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    await db.collection(req.params.collection).updateOne(
      { _id: req.params.id as any },
      { $set: updateData }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/mongodb/:collection/:id", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  try {
    const db = mongoClient.db("aset_app");
    await db.collection(req.params.collection).deleteOne({ _id: req.params.id as any });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
  // MongoDB connection
  if (process.env.MONGODB_URI) {
    connectDB().catch(err => {
      console.error("MongoDB background connection failed:", err);
    });
  }

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

  // API 404 handler
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer().catch(console.error);

export default app;
