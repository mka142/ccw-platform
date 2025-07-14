import { NextResponse } from "next/server";
import { getMusicSliderData } from "@/lib/formUtils";

export async function GET(request: Request, { params }: { params: { formId: string; fieldId: string } }) {
  const { formId, fieldId } = params;
  if (!formId || !fieldId) {
    return NextResponse.json({ error: "Missing formId or fieldId" }, { status: 400 });
  }
  const data = await getMusicSliderData(formId, fieldId);
  return NextResponse.json({ data });
}