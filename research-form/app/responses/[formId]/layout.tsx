import { headers } from "next/headers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFormSchemaForId } from "@/config/form";
import Link from "next/link";
import { CACHE_TAGS, getFirstResponseId, getResponseCounts } from "@/lib/formUtils";
import { unstable_cache } from "next/cache";
import { REVALIDATE_INTERVAL } from "@/config";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const formSchema = getFormSchemaForId(formId);
  const cacheGetResponseCounts = unstable_cache(async (id: string) => {
    return await getResponseCounts(id);
  }, [CACHE_TAGS.form(formId)], {
    tags: [CACHE_TAGS.form(formId)],
    revalidate: REVALIDATE_INTERVAL
  });
  const { total, corrupted } = await cacheGetResponseCounts(formId);
  const cacheGetFirstResponseId = unstable_cache(async (formId: string) => {
    return await getFirstResponseId(formId);
  }, [CACHE_TAGS.form(formId)], {
    tags: [CACHE_TAGS.form(formId)],
    revalidate: REVALIDATE_INTERVAL
  });
  const firstResponseId = await cacheGetFirstResponseId(formId);

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
                href={`/responses/${formId}/res${firstResponseId ? `/${firstResponseId}` : ""
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
