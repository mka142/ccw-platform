import { CACHE_TAGS, getData } from "@/lib/formUtils";
import { getFormSchemaForId } from "@/config/form";
import { ResponsesChartsProvider } from "@/components/charts/ResponsesChartsProvider";
import { Button } from "@/components/ui/button";
import { FormSchema } from "@/lib/formSchema";
import { unstable_cache } from 'next/cache';
import { REVALIDATE_INTERVAL } from "@/config";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  // Use cache for form data
  const getCachedData = unstable_cache(async (formId: string) => {
    return await getData(formId);
  }, [formId], {
    tags: [CACHE_TAGS.form(formId)],
    revalidate: REVALIDATE_INTERVAL, // Revalidate every 6000 seconds
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
      <div className="flex gap-4 mb-6 justify-end">
        <p className="my-auto">Pobierz dane:</p>
        <a
          href={`summary/download?type=json`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button type="button" variant="outline">JSON</Button>
        </a>
        <a
          href={`summary/download?type=excel`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button type="button" variant="outline">XLSX</Button>
        </a>
      </div>
      <ResponsesChartsProvider
        formData={formData}
        formSchema={formSchema as FormSchema}
      />
    </>
  );
}
