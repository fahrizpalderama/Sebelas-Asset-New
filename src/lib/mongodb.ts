import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('MONGODB_URI is not defined in environment variables. MongoDB connection skipped.');
}

export const client = uri ? new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}) : null;

export async function connectDB() {
  if (!client) return null;
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return null;
  }
}
