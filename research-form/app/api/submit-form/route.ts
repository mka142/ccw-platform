import { NextResponse } from "next/server";
import { CACHE_TAGS, submitForm } from "@/lib/formUtils";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const data = await request.json();
  const result = await submitForm(data);
  if (result.success) {
    revalidateTag(CACHE_TAGS.form(data.formId));
    return NextResponse.json({ success: true, id: result.id });
  } else {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }
}
