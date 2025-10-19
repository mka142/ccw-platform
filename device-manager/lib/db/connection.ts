import { MongoClient, Db } from "mongodb";

const mongoUri = process.env.MONGO_URI ?? "mongodb://root:example@localhost:27017/";
const databaseName = process.env.MONGO_DATABASE ?? "ccw-platform";

let mongoClientInstance: MongoClient | null = null;

// Setting the maximum pool size for the connection pool
const maxPoolSize = 10;

// Object of connection options
const connectionOptions = {
  maxPoolSize,
};

async function connectToDb(url = mongoUri): Promise<Db> {
  if (!mongoClientInstance) {
    mongoClientInstance = await MongoClient.connect(url, connectionOptions);
    console.log("MongoDB Connected Successfully");
  }

  // returning a reference to the database
  return mongoClientInstance.db(databaseName);
}

export { connectToDb };
