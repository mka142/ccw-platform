import { getFirstResponseId } from "@/lib/formUtils";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const firstResponseId = await getFirstResponseId(formId);

  if (!firstResponseId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Brak odpowiedzi</h1>
        <p className="text-gray-600">
          Nie znaleziono żadnych odpowiedzi dla tego formularza.
        </p>
      </div>
    );
  }

  // redirect to ./summary page
  redirect(`/responses/${(await params).formId}/res/${firstResponseId}`);
}
