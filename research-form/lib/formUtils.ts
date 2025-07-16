"server only";
import { mongoWrapper } from "@/lib/mongoClient";
import { getFormSchemaForId } from "@/config/form";
import { FormSchema } from "./formSchema";
import { ObjectId, WithId, Document } from "mongodb";
import { revalidateTag } from "next/cache";

const DB_NAME = "ccw";
const COLLECTION_NAME = "research_form";

const _CORRUPTED_FIELD = "_corrupted";

export const CACHE_TAGS = {
  form: (formId: string) => `form-${formId}`,
  response: (formId: string, responseId: string) => `response-${formId}-${responseId}`,
};

export async function submitForm(
  data: Record<string, unknown>
): Promise<{ success: boolean; id?: string; error?: string }> {
  return await mongoWrapper(
    async (client) => {
      const result = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .insertOne(data);
      return { success: true, id: result.insertedId.toString() };
    },
    (error) => {
      console.error("MongoDB error:", error);
      return {
        success: false,
        error: (error as Record<string, unknown>)?.message || String(error),
      };
    }
  );
}

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
    { $match: { formId, [_CORRUPTED_FIELD]: { $ne: true } } },
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

export async function getMusicSliderData(
  formId: string,
  fieldId: string
): Promise<Array<{ _id: string; values: Array<[number, number]> }>> {
  const pipeline = [
    { $match: { formId, [_CORRUPTED_FIELD]: { $ne: true } } },
    {
      $project: {
        _id: 1,
        values: `$formData.${fieldId}`,
      },
    },
    { $sort: { _id: 1 } },
  ];
  return await mongoWrapper(
    async (client) => {
      const data = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .aggregate(pipeline)
        .toArray();
      // Convert _id to string for consistency
      return data.map((doc: any) => ({ _id: doc._id.toString(), values: doc.values }));
    },
    () => []
  );
}

// Get all _ids for a given formId
export async function getResponseIds(formId: string): Promise<string[]> {
  return await mongoWrapper(
    async (client) => {
      const docs = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .find({ formId }, { projection: { _id: 1 } })
        .sort({ _id: 1 }) // oldest first
        .toArray();
      return docs.map((doc) => doc._id.toString());
    },
    () => []
  );
}

export async function getResponseIdIndexMap(formId: string): Promise<Record<string, number>> {
  const ids = await getResponseIds(formId);
  const map: Record<string, number> = {};
  ids.forEach((id, idx) => {
    map[id] = idx;
  });
  return map;
}

// Get count all responses and corrupted responses for a given formId
export async function getResponseCounts(
  formId: string
): Promise<{ total: number; corrupted: number }> {
  return await mongoWrapper(
    async (client) => {
      const total = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .countDocuments({ formId });

      const corrupted = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .countDocuments({ formId, [_CORRUPTED_FIELD]: true });

      return { total, corrupted };
    },
    () => ({ total: 0, corrupted: 0 })
  );
}

// Get first response id by formId
export async function getFirstResponseId(
  formId: string
): Promise<string | null> {
  return await mongoWrapper(async (client) => {
    const docs = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .find({ formId }, { projection: { _id: 1 } })
      .sort({ _id: 1 }) // oldest first
      .limit(1)
      .toArray();
    return docs.length > 0 ? docs[0]._id.toString() : null;
  });
}

// Get a single response by formId and _id
export async function getResponse(
  formId: string,
  _id: string
): Promise<WithId<Document> | null> {
  return await mongoWrapper(
    async (client) => {
      const doc = await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .findOne<WithId<Document>>({ formId, _id: new ObjectId(_id) });
      return doc || null;
    },
    () => null
  );
}

// set response as  corrupted - after that  we will exclude the response in the get data function
export async function setResponseCorrupted(
  formId: string,
  _id: string,
  isCorrupted = false
) {
  return await mongoWrapper(
    async (client) => {
      await client
        .db(DB_NAME)
        .collection(COLLECTION_NAME)
        .updateOne(
          { formId, _id: new ObjectId(_id) },
          { $set: { [_CORRUPTED_FIELD]: isCorrupted } }
        );
    },
    () => null
  );
}
