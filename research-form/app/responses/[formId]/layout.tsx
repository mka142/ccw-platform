import { headers } from "next/headers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFormSchemaForId } from "@/config/form";
import Link from "next/link";
import { getFirstResponseId, getResponseCounts } from "@/lib/formUtils";
import { cache } from "react";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const formSchema = getFormSchemaForId(formId);
  const cacheGetResponseCounts = cache(async (id: string) => {
    console.log("Fetching response counts for formId:", id);
    return await getResponseCounts(id);
  });
  const { total, corrupted } = await cacheGetResponseCounts(formId);
  const firstResponseId = await getFirstResponseId(formId);

  const headerList = await headers();
  const pathname = headerList.get("x-current-path");

  const isSummaryPage = pathname?.startsWith(`/responses/${formId}/summary`);

  return (
    <>
      <div className="max-w-2xl mx-auto px-0 md:p-6">
        <h1 className="text-2xl font-bold mb-4">
          Odpowiedzi formularza:{" "}
          <span
            dangerouslySetInnerHTML={{ __html: formSchema?.formTitle || "" }}
          />
        </h1>
        <Tabs
          defaultValue={isSummaryPage ? "summary" : "responses"}
          className="mb-4"
        >
          <TabsList className="w-full flex gap-2">
            <TabsTrigger asChild value="summary">
              <Link href={`/responses/${formId}/summary`}>
                Podsumowanie ({total - corrupted})
              </Link>
            </TabsTrigger>
            <TabsTrigger asChild value="responses">
              <Link
                href={`/responses/${formId}/res${
                  firstResponseId ? `/${firstResponseId}` : ""
                }`}
              >
                Odpowiedzi ({total})
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {children}
      </div>
    </>
  );
}
