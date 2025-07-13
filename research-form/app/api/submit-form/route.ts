import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || ""; // Ensure this is set in your environment variables
const DB_NAME = "ccw";
const COLLECTION_NAME = "research_form";

export async function POST(request: Request) {
  const data = await request.json();
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.insertOne(data);
    return NextResponse.json({ success: true, id: result.insertedId });
    // eslint-disable-next-line
  } catch (error: any) {
    console.error("MongoDB error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
