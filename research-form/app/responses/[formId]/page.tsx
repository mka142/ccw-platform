import { getData } from "@/lib/formUtils";
import { getFormSchemaForId } from "@/config/form";
import { ResponsesChartsProvider } from "@/components/charts/ResponsesChartsProvider";
import { FormSchema } from "@/lib/formSchema";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  // Optionally, you can fetch the form schema if needed
  // const formSchema = await getFormSchemaForId(formData.formId);
  const { formId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formData: Record<string, any> | null = await getData(formId);
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
    <div className="max-w-2xl mx-auto px-0 md:p-6">
      <h1 className="text-2xl font-bold mb-4">
        Odpowiedzi formularza:{" "}
        <span
          dangerouslySetInnerHTML={{ __html: formSchema?.formTitle || "" }}
        />
      </h1>
      <ResponsesChartsProvider
        formData={formData}
        formSchema={formSchema as FormSchema}
      />
    </div>
  );
}