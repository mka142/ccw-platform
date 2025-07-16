
import { NextResponse } from "next/server";
import { CACHE_TAGS, downloadAllResponses } from "@/lib/formUtils";
import * as XLSX from "xlsx";
import { getFormSchemaForId } from "@/config/form";
import { unstable_cache } from "next/cache";
import { REVALIDATE_INTERVAL } from "@/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDataObjectsToStrings(data: any[]): any[] {
  return data.map(item => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newItem: any = {};
    Object.keys(item).forEach(key => {
      if (Array.isArray(item[key])) {
        newItem[key] = item[key].map(value => value.toString()).join(", ");
      } else if (typeof item[key] === "object" && item[key] !== null) {
        // Handle nested objects, convert to JSON string
        newItem[key] = JSON.stringify(item[key]);
      } else {
        newItem[key] = item[key];
      }
    });
    return newItem;
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const formSchema = getFormSchemaForId(formId);
  if (!formSchema) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const formSchemaIdTitleMap = formSchema?.formPages.reduce((acc, page) => {
    page.fields.forEach(field => {
      if (field.id && field.title) {
        acc[field.id] = field.title;
      }
    });
    return acc;
  }, {} as Record<string, string>);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "csv";
  try {
    const cacheData = unstable_cache(async (formId) => await downloadAllResponses(formId), [
      CACHE_TAGS.form(formId)], {
      tags: [
        CACHE_TAGS.form(formId)
      ],
      revalidate: REVALIDATE_INTERVAL
    })
    const data = await cacheData(formId);
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No responses found" }, { status: 404 });
    }
    let body: string | Buffer;
    let contentType: string;
    let filename: string;
    if (type === "json") {
      body = JSON.stringify(data, null, 2);
      contentType = "application/json";
      filename = `responses-${formId}.json`;
    } else if (type === "excel" || type === "xlsx") {
      const musicSliderFields: string[] = formSchema.formPages.flatMap(page =>
        page.fields.filter(field => field.type === "musicSlider").map(field => field.id)
      ) as string[];
      // Create a data with correct keys order based on formSchema
      const parsedData = parseDataObjectsToStrings(data.map(item => item.formData));
      const orderedData = parsedData.map((item, index) => {
        const orderedItem: Record<string, string> = {};
        // Add index field
        orderedItem["index"] = String(index + 1);

        Object.keys(formSchemaIdTitleMap).forEach(key => {

          if (musicSliderFields.includes(key)) {
            orderedItem[key] = `Dane muzyczne - ${key}`; // Placeholder for musicSlider fields
          } else {
            orderedItem[key] = item[key] !== undefined ? item[key].toString() : "";
          }
        });

        return orderedItem;
      });
      const worksheet = XLSX.utils.json_to_sheet(orderedData);
      // Set column headers based on formSchema titles
      /* replace first row */
      XLSX.utils.sheet_add_aoa(worksheet, [['index', ...Object.values(formSchemaIdTitleMap)]], { origin: "A1" });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

      // Write to each new sheet each of the musicSlider fields
      // The data should be in the fromat col1:index, col2:time, col3:value
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formData = data.map(i => i.formData as { [key: string]: any });
      musicSliderFields.forEach(fieldId => {
        const musicSliderData = formData.map(((item, index) => {
          const values = item[fieldId];
          //eslint-disable-next-line 
          return values.map((value: any, _: number) => ({
            index: index + 1,
            time: value[0],
            value: value[1] // Assuming value is an array with [time, value]
          }));
        })).flat();

        const musicSliderSheet = XLSX.utils.json_to_sheet(musicSliderData);
        // Set column headers for musicSlider fields
        XLSX.utils.sheet_add_aoa(musicSliderSheet, [['index', 'Czas', 'Wartość']], { origin: "A1" });
        XLSX.utils.book_append_sheet(
          workbook,
          musicSliderSheet,
          `Dane muzyczne - ${fieldId}`

        )
      });


      body = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename = `responses-${formId}.xlsx`;
    } else {
      throw new Error("Unsupported type. Use 'json' or 'xlsx'.");
    }


    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Błąd pobierania danych" }, { status: 500 });
  }
}
