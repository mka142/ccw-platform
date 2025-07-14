import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://root:example@localhost:27017/";

/**
 * MongoDB wrapper for API routes.
 * Usage:
 *   mongoWrapper(async (client) => { ... })
 *     .then(response => ...)
 *     .catch(errorResponse => ...)
 */
export async function mongoWrapper<T>(
  clientFn: (client: MongoClient) => Promise<T>,
  // eslint-disable-next-line
  onError?: (error: unknown) => any
): Promise<T> {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const result = await clientFn(client);
    return result;
  } catch (error) {
    if (onError) {
      return onError(error);
    }
    throw error;
  } finally {
    if (client) await client.close();
  }
}