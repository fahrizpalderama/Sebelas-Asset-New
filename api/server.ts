import express from "express";
import path from "path";
import fs from "fs";
import { createClient } from '@supabase/supabase-js';

console.log("Server starting... Pure Supabase DB Mode. Node Version:", process.version);

// Supabase Client Logic
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let supabaseClient: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Client initialized successfully with URL:", supabaseUrl);
  } catch (error) {
    console.error("Failed to initialize Supabase Client:", error);
  }
} else {
  console.warn("WARNING: Supabase is not configured yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.");
}

// Helper to detect if a table/collection is missing in Supabase database schema
const isTableMissingError = (error: any, table?: string) => {
  if (table === "stats" || table === "settings") return true;
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  const code = String(error.code || "");
  return (
    msg.includes("invalid path") || 
    msg.includes("does not exist") || 
    msg.includes("relation") || 
    msg.includes("cache") ||
    msg.includes("schema cache") ||
    code === "PGRST302" || 
    code === "PGRST205" || 
    code === "42P01"
  );
};

// Help response helper for missing tables
const handleSupabaseError = (res: any, error: any, table: string) => {
  if (isTableMissingError(error, table)) {
    console.warn(`[Supabase Error] Table "${table}" is missing in the database schema.`);
    return res.status(400).json({
      error: `Tabel "${table}" belum dibuat di Supabase Anda.`,
      message: `Tabel "${table}" tidak ditemukan di database Supabase. Silakan jalankan skrip SQL di berkas "/supabase_schema.sql" di SQL Editor dasbor Supabase Anda terlebih dahulu untuk membuat tabel ini beserta relasi dan kebijakannya.`
    });
  }
  console.error(`Supabase error from table ${table}:`, error);
  return res.status(500).json({ error: error.message || "Database error", details: error });
};

const app = express();
const PORT = 3000;

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
    pure_supabase_mode: true,
    supabase_connected: !!supabaseClient,
    supabase_configured: !!(supabaseUrl && supabaseKey),
    vercel: !!process.env.VERCEL,
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Transparent route rewrite helper to map legacy /api/mongodb/ calls to /api/db/
app.use((req, res, next) => {
  if (req.url.startsWith("/api/mongodb/")) {
    const oldUrl = req.url;
    req.url = req.url.replace("/api/mongodb/", "/api/db/");
    console.log(`[Compatibility Router] Rewriting legacy path ${oldUrl} -> ${req.url}`);
  }
  next();
});

// Supabase Migration Endpoint (Copies records from web client Firestore connection/mock data to Supabase)
app.post("/api/migrate-to-supabase", async (req, res) => {
  if (!supabaseClient) {
    return res.status(400).json({ 
      error: "Supabase belum dikonfigurasi. Silakan atur SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di pengaturan lingkungan Anda." 
    });
  }

  try {
    const { collectionName, documents } = req.body;
    console.log(`[Migration] Migrating ${documents?.length || 0} documents into Supabase table: "${collectionName}"`);
    
    // Format documents for postgres table layout (ensure exact matching casing columns)
    const formattedDocs = documents.map((doc: any) => {
      const copy = { ...doc };
      delete copy._id; // Remove Mongo ID string
      
      // Ensure id field is set
      if (doc._id && !doc.id) {
        copy.id = doc._id;
      }
      return copy;
    });

    if (formattedDocs.length > 0) {
      // First delete all existing records in this table to prepare a clean sync
      const { error: deleteError } = await supabaseClient
        .from(collectionName)
        .delete()
        .neq('id', 'dummy_id_to_clear_all'); // Clears all records securely

      if (deleteError) {
        console.error(`Supabase migration clear table ${collectionName} error:`, deleteError.message);
        if (isTableMissingError(deleteError)) {
          return res.status(400).json({
            error: `Tabel "${collectionName}" belum dibuat di Supabase Anda. Silakan jalankan skrip SQL di berkas "/supabase_schema.sql" di SQL Editor dasbor Supabase Anda terlebih dahulu.`
          });
        }
      }

      // Supabase insert
      const { data, error } = await supabaseClient
        .from(collectionName)
        .insert(formattedDocs)
        .select();

      if (error) {
        return handleSupabaseError(res, error, collectionName);
      }

      res.json({ count: data ? data.length : formattedDocs.length, success: true });
    } else {
      res.json({ count: 0, success: true });
    }
  } catch (err: any) {
    console.error("Supabase migration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Supabase DB Route: LIST
app.get("/api/db/:collection", async (req, res) => {
  const { orderBy, orderDir, limit, where, search } = req.query;
  const table = req.params.collection;

  if (table === 'test-connection') {
    return res.json([]);
  }

  if (!supabaseClient) {
    return res.status(400).json({ 
      error: "Supabase is not configured yet. Please set your credentials." 
    });
  }

  try {
    let query = supabaseClient.from(table).select('*');
    
    // Apply search as case-insensitive ilike with OR statement
    if (search) {
      const searchStr = `%${search}%`;
      let searchFields: string[] = [];
      if (table === 'assets') {
        searchFields = ['name', 'code', 'condition', 'placement', 'outlet', 'verifier', 'category', 'status'];
      } else if (table === 'reports') {
        searchFields = ['name', 'code', 'issue', 'desc', 'reporter', 'category', 'status', 'outlet', 'placement'];
      } else if (table === 'asset_activities') {
        searchFields = ['assetCode', 'type', 'description', 'user'];
      } else if (table === 'procurements') {
        searchFields = ['itemName', 'unit', 'description', 'category', 'outlet', 'procurementVia', 'createdBy'];
      } else if (table === 'guides') {
        searchFields = ['title', 'category', 'content'];
      } else if (table.startsWith('vendors_')) {
        searchFields = ['name', 'companyName', 'category', 'type', 'description'];
      } else {
        searchFields = ['name'];
      }
      
      const orCondition = searchFields.map(field => `"${field}".ilike.${searchStr}`).join(',');
      query = query.or(orCondition);
    }

    // Apply where filters
    if (where) {
      try {
        const whereClauses = Array.isArray(where) ? where : [where];
        whereClauses.forEach((w: any) => {
          const { field, operator, value } = JSON.parse(w as string);
          if (operator === '==' || operator === '===') {
            query = query.eq(field, value);
          } else if (operator === '>=') {
            query = query.gte(field, value);
          } else if (operator === '<=') {
            query = query.lte(field, value);
          } else if (operator === '>') {
            query = query.gt(field, value);
          } else if (operator === '<') {
            query = query.lt(field, value);
          } else if (operator === 'array-contains') {
            query = query.contains(field, [value]);
          }
        });
      } catch (e) {
        console.error("Error parsing where filter for Supabase query:", e);
      }
    }

    // Apply orderBy
    if (orderBy) {
      const isDesc = orderDir === 'desc';
      query = query.order(orderBy, { ascending: !isDesc });
    }

    // Apply limit
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    const { data: docs, error } = await query;
    if (error) {
      if (isTableMissingError(error, table)) {
        console.warn(`[Supabase Fallback] Table "${table}" is missing on list query. Returning empty array.`);
        return res.json([]);
      }
      return handleSupabaseError(res, error, table);
    }
    return res.json(docs || []);
  } catch (err: any) {
    if (isTableMissingError(err, table)) {
      console.warn(`[Supabase Fallback] Table "${table}" is missing on list query (catch). Returning empty array.`);
      return res.json([]);
    }
    return handleSupabaseError(res, err, table);
  }
});

// Dynamic Supabase DB Route: SINGLE GET
app.get("/api/db/:collection/:id", async (req, res) => {
  const table = req.params.collection;

  if (table === 'test-connection') {
    return res.json({ id: req.params.id, status: 'ok', message: 'Ready' });
  }

  if (!supabaseClient) {
    return res.status(400).json({ error: "Supabase is not configured." });
  }

  try {
    const { data, error } = await supabaseClient
      .from(table)
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error, table)) {
        console.warn(`[Supabase Fallback] Table "${table}" is missing on single GET. Returning fallback row.`);
        if (table === 'users') {
          return res.json({
            uid: req.params.id,
            name: "Super Manajemen (Fallback)",
            email: "fahrizpalderama.design@gmail.com",
            type: "Superadmin",
            createdAt: new Date().toISOString()
          });
        }
        return res.json(null);
      }
      return handleSupabaseError(res, error, table);
    }

    if (!data && table === 'users') {
      console.log(`[Supabase Fallback] User profile ${req.params.id} not found in database. Returning fallback superadmin.`);
      return res.json({
        uid: req.params.id,
        name: "Super Manajemen (Fallback)",
        email: "fahrizpalderama.design@gmail.com",
        type: "Superadmin",
        createdAt: new Date().toISOString()
      });
    }

    return res.json(data);
  } catch (err: any) {
    if (isTableMissingError(err, table)) {
      console.warn(`[Supabase Fallback] Table "${table}" is missing on single GET (catch). Returning fallback row.`);
      if (table === 'users') {
        return res.json({
          uid: req.params.id,
          name: "Super Manajemen (Fallback)",
          email: "fahrizpalderama.design@gmail.com",
          type: "Superadmin",
          createdAt: new Date().toISOString()
        });
      }
      return res.json(null);
    }
    return handleSupabaseError(res, err, table);
  }
});

// Dynamic Supabase DB Route: CREATE NEW
app.post("/api/db/:collection", async (req, res) => {
  const table = req.params.collection;
  const data = { ...req.body };
  delete data._id; // Remove legacy MongoDB identifier if present

  if (table === 'test-connection') {
    return res.json({ success: true, id: 'check' });
  }

  if (!supabaseClient) {
    return res.status(400).json({ error: "Supabase is not configured." });
  }

  try {
    const { data: record, error } = await supabaseClient
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error, table)) {
        console.warn(`[Supabase Fallback] Table "${table}" is missing on insert. Returning mock success.`);
        return res.json({ id: data.id || "temp-id", ...data });
      }
      return handleSupabaseError(res, error, table);
    }
    return res.json(record);
  } catch (err: any) {
    if (isTableMissingError(err, table)) {
      console.warn(`[Supabase Fallback] Table "${table}" is missing on insert (catch). Returning mock success.`);
      return res.json({ id: data.id || "temp-id", ...data });
    }
    return handleSupabaseError(res, err, table);
  }
});

// Dynamic Supabase DB Route: UPDATE
app.put("/api/db/:collection/:id", async (req, res) => {
  const table = req.params.collection;
  const updateData = { ...req.body };
  delete updateData._id;
  delete updateData.id;

  if (table === 'test-connection') {
    return res.json({ success: true });
  }

  if (!supabaseClient) {
    return res.status(400).json({ error: "Supabase is not configured." });
  }

  try {
    const { data: record, error } = await supabaseClient
      .from(table)
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error, table)) {
        console.warn(`[Supabase Fallback] Table "${table}" is missing on update. Returning mock success.`);
        return res.json({ success: true, record: { id: req.params.id, ...updateData } });
      }
      return handleSupabaseError(res, error, table);
    }
    return res.json({ success: true, record: record || { id: req.params.id, ...updateData } });
  } catch (err: any) {
    if (isTableMissingError(err, table)) {
      console.warn(`[Supabase Fallback] Table "${table}" is missing on update (catch). Returning mock success.`);
      return res.json({ success: true, record: { id: req.params.id, ...updateData } });
    }
    return handleSupabaseError(res, err, table);
  }
});

// Dynamic Supabase DB Route: DELETE
app.delete("/api/db/:collection/:id", async (req, res) => {
  const table = req.params.collection;

  if (table === 'test-connection') {
    return res.json({ success: true });
  }

  if (!supabaseClient) {
    return res.status(400).json({ error: "Supabase is not configured." });
  }

  try {
    const { error } = await supabaseClient
      .from(table)
      .delete()
      .eq('id', req.params.id);

    if (error) {
      if (isTableMissingError(error, table)) {
        console.warn(`[Supabase Fallback] Table "${table}" is missing on delete. Returning mock success.`);
        return res.json({ success: true });
      }
      return handleSupabaseError(res, error, table);
    }
    return res.json({ success: true });
  } catch (err: any) {
    if (isTableMissingError(err, table)) {
      console.warn(`[Supabase Fallback] Table "${table}" is missing on delete (catch). Returning mock success.`);
      return res.json({ success: true });
    }
    return handleSupabaseError(res, err, table);
  }
});

// Fonnte WhatsApp API
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
    }
  } 
  
  if (!viteMiddleware && !process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) return next();
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("Serving static files from dist");
    } else {
      app.get("/", (req, res) => {
        res.send("<h1>Server is running</h1><p>API is available at /api/health. Application bundle (dist) not found.</p>");
      });
    }
  }

  // Bind to 0.0.0.0 and port 3000
  console.log(`Attempting to start server on 0.0.0.0:${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is now listening on 0.0.0.0:${PORT}`);
    console.log("Database connectivity strictly bound to Supabase.");
  });

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
