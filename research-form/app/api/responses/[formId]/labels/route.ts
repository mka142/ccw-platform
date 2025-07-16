
import { NextResponse } from "next/server";
import { getResponseIdIndexMap } from "@/lib/formUtils";

export async function GET(req: Request, { params }: { params: Promise<{ formId: string }> }) {
    const { formId } = await params;
    const idIndexMap = await getResponseIdIndexMap(formId);
    // Return as array of { _id, label }
    const labels = Object.entries(idIndexMap).map(([id, idx]) => ({ _id: id, label: `Odpowiedź ${idx + 1}` }));
    return NextResponse.json(labels);
}
