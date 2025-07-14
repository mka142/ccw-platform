import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  // redirect to ./summary page
  redirect(`/responses/${(await params).formId}/summary`);
}
