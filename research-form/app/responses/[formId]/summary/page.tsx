import { getData } from "@/lib/formUtils";
import { getFormSchemaForId } from "@/config/form";
import { ResponsesChartsProvider } from "@/components/charts/ResponsesChartsProvider";
import { FormSchema } from "@/lib/formSchema";
import { cache } from "react";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  // Use cache for form data
  const getCachedData = cache(async (formId: string) => {
    return await getData(formId);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formData: Record<string, any> | null = await getCachedData(formId);
  const formSchema = getFormSchemaForId(formId);

  if (!formData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Brak danych formularza</h1>
        <p className="text-gray-600">
          Nie znaleziono odpowiedzi dla tego formularza.
        </p>
      </div>
    );
  }

  return (
    <>
      <ResponsesChartsProvider
        formData={formData}
        formSchema={formSchema as FormSchema}
      />
    </>
  );
}
