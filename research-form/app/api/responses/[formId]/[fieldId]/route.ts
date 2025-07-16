import { NextResponse } from "next/server";
import { CACHE_TAGS, getMusicSliderData } from "@/lib/formUtils";
import { unstable_cache } from "next/cache";
import { REVALIDATE_INTERVAL } from "@/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string; fieldId: string }> }
) {
  const { formId, fieldId } = await params;



  if (!formId || !fieldId) {
    return NextResponse.json(
      { error: "Missing formId or fieldId" },
      { status: 400 }
    );
  }

  const cacheGetMusicSliderData = unstable_cache(
    async (formId: string, fieldId: string) => {
      return getMusicSliderData(formId, fieldId);
    },
    [CACHE_TAGS.form(formId)],
    {
      tags: [CACHE_TAGS.form(formId)],
      revalidate: REVALIDATE_INTERVAL,
    }
  )


  const data = await cacheGetMusicSliderData(formId, fieldId);
  return NextResponse.json({ data });
}
