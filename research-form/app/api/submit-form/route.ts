import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

const URL = process.env.POCKETBASE_URL || "";
const TOKEN = process.env.POCKETBASE_TOKEN || "";
const COLLECTION_ID = process.env.POCKETBASE_COLLECTION_ID || "submissions";

export async function POST(request: Request) {
  const data = await request.json();

  const pb = new PocketBase(URL);
  try {
    await pb.authStore.save(TOKEN, null);
    const record = await pb.collection(COLLECTION_ID).create(data);
    return NextResponse.json({ success: true, id: record.id });
    // eslint-disable-next-line
  } catch (error: any) {
    console.error("PocketBase error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
