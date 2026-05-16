import express from "express";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { connectDB, client as mongoClient } from "./src/lib/mongodb";

// Load firebase config manually to be safe with CJS/ESM bundling
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
let firebaseApp: admin.app.App;
try {
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized for project:", firebaseConfig.projectId);
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

// Function to get Firestore instance for the specific database
const getDb = () => {
  return getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
};

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connection
if (process.env.MONGODB_URI) {
  connectDB().then(() => {
    console.log("MongoDB initialization process finished");
  }).catch(err => {
    console.error("MongoDB background connection failed:", err);
  });
} else {
  console.log("MONGODB_URI not provided, skipping MongoDB connection");
}

// Migration Endpoint
app.post("/api/migrate-to-mongodb", async (req, res) => {
  if (!mongoClient) {
    return res.status(500).json({ error: "MongoDB client is not initialized" });
  }

  const { collectionName, documents } = req.body;

  if (!collectionName || !Array.isArray(documents)) {
    return res.status(400).json({ error: "Invalid payload. collectionName and documents array are required." });
  }

  try {
    const mongoDb = mongoClient.db("aset_app"); 
    console.log(`Migrating collection: ${collectionName} (${documents.length} docs)...`);

    // Clean data and add metadata
    const docsToInsert = documents.map(doc => ({
      ...doc,
      _id: doc.id || doc._id, // Use original ID as _id
      migratedAt: new Date(),
      source: "firestore"
    }));

    // Clear existing to prevent duplicates
    await mongoDb.collection(collectionName).deleteMany({}); 
    
    if (docsToInsert.length > 0) {
      const insertResult = await mongoDb.collection(collectionName).insertMany(docsToInsert);
      res.json({
        message: `Success: ${insertResult.insertedCount} documents migrated to '${collectionName}'`,
        count: insertResult.insertedCount
      });
    } else {
      res.json({
        message: `Collection '${collectionName}' was empty. No documents moved.`,
        count: 0
      });
    }

  } catch (error: any) {
    console.error(`Migration Error for ${collectionName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// MongoDB Generic API
app.get("/api/mongodb/:collection", async (req, res) => {
  if (!mongoClient) return res.status(500).json({ error: "MongoDB not connected" });
  try {
    const db = mongoClient.db("aset_app");
    const { orderBy, orderDir, limit } = req.query;
    
    let queryBuilder = db.collection(req.params.collection).find({});
    
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
    const { id } = req.params;
    const doc = await db.collection(req.params.collection).findOne({ _id: id as any });
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
    // Map 'id' to '_id' for compatibility if provided
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
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    
    await db.collection(req.params.collection).updateOne(
      { _id: id as any },
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
    const { id } = req.params;
    await db.collection(req.params.collection).deleteOne({ _id: id as any });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fonnte WhatsApp API Route
app.post("/api/whatsapp", async (req, res) => {
  const { target, message } = req.body;
  const token = process.env.FONNTE_TOKEN || "D29H1kvj4usxSjdsUMD5";

  if (!target || !message) {
    return res.status(400).json({ error: "Target and message are required" });
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target,
        message,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Fonnte API Error:", error);
    res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

async function setupApp() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupApp().catch(console.error);

export default app;
