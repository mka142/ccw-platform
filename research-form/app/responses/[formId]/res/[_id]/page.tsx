import {
  CACHE_TAGS,
  getResponse,
  getResponseIds,
  setResponseCorrupted,
} from "@/lib/formUtils";

import { getFormSchemaForId } from "@/config/form";
import { SchemaFormViewerWithMusicChart } from "@/app/components/SchemaFormViewerWithMusicChart";
import { redirect } from "next/navigation";
import React from "react";
import ResponseIdSelect from "./ResponseIdSelect";
import { revalidateTag, unstable_cache } from 'next/cache';
import FormChangeCorruptedState from "./FormChangeCorruptedState";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string; _id: string }>;
}) {
  // get response data
  const { formId, _id } = await params;
  const cacheResponseData = unstable_cache(async (formId: string, _id: string) => {
    console.log("<strong>I am being called</strong>", formId, _id);
    return await getResponse(formId, _id);
  }, [CACHE_TAGS.response(formId, _id)], {
    tags: [CACHE_TAGS.response(formId, _id)],
    revalidate: 3600, // Revalidate every 600 seconds
  });

  const responseData = await cacheResponseData(formId, _id);
  const formSchema = getFormSchemaForId(formId);

  const responseIds = await getResponseIds(formId);

  if (!responseData || !formSchema) {
    redirect(`/responses/${formId}/res`);
  }

  const isCorrupted: boolean = responseData["_corrupted"] || false;

  async function markCorruptedAction() {
    "use server";
    await setResponseCorrupted(formId, _id, !isCorrupted);
    revalidateTag(CACHE_TAGS.response(formId, _id));
    revalidateTag(CACHE_TAGS.form(formId)); // needs to be revalidated to update summary charts
    redirect(`/responses/${formId}/res/${_id}`);
  }

  return (
    <>
      <ResponseIdSelect
        responseIds={responseIds}
        currentId={_id}
        formId={formId}
      />
      <FormChangeCorruptedState isCorrupted={isCorrupted} action={markCorruptedAction} />
      <SchemaFormViewerWithMusicChart
        schema={formSchema}
        responseData={responseData.formData}
      />
    </>
  );
}
