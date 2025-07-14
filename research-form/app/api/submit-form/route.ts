import { NextResponse } from "next/server";
import { submitForm } from "@/lib/formUtils";

export async function POST(request: Request) {
  const data = await request.json();
  const result = await submitForm(data);
  if (result.success) {
    return NextResponse.json({ success: true, id: result.id });
  } else {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }
}
