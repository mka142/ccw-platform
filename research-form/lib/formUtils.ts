"server only";
import { mongoWrapper } from "@/lib/mongoClient";
import { getFormSchemaForId } from "@/config/form";
import { FormSchema } from "./formSchema";

const DB_NAME = "ccw";
const COLLECTION_NAME = "research_form";

const getNonAudioFields = (formSchema: FormSchema) => {
  return formSchema.formPages.flatMap((page) =>
    page.fields.filter((field) => field.type !== "musicSlider")
  );
};

// summary non audio fields
export async function getData(formId: string) {
  const formSchema = getFormSchemaForId(formId);

  if (!formSchema) {
    return null; // or throw an error if preferred
  }

  const nonAudioFields = getNonAudioFields(formSchema);

  // Build $group stage dynamically
  const groupStage: Record<string, unknown> = { _id: null };
  nonAudioFields.forEach((field) => {
    groupStage[`${field.id}Array`] = { $push: `$formData.${field.id}` };
  });

  // Build $project stage dynamically
  const projectStage: Record<string, unknown> = { _id: 0 };
  nonAudioFields.forEach((field) => {
    projectStage[`formData${field.id}`] = `$${field.id}Array`;
  });

  const pipeline = [
    { $match: { formId } },
    { $group: groupStage },
    { $project: projectStage },
  ];

  return await mongoWrapper(
    async (client) => {
      const data = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .aggregate(pipeline)
        .toArray();
      return data.length > 0 ? data[0] : null;
    },
    () => null
  );
}

export async function getMusicSliderData(formId: string, fieldId: string): Promise<Array<Array<[number, number]>>> {
  const pipeline = [
    { $match: { formId } },
    {
      $group: {
        _id: null,
        allArrays: { $push: `$formData.${fieldId}` }
      }
    },
    {
      $project: {
        _id: 0,
        allArrays: 1
      }
    }
  ];
  return await mongoWrapper(
    async (client) => {
      const data = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .aggregate(pipeline)
        .toArray();
      return data.length > 0 ? data[0].allArrays : [];
    },
    () => []
  );
}