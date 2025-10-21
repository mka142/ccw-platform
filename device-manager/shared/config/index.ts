import path from "node:path";
import { fileURLToPath } from "node:url";

/* Server app configuration */
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);

export const appConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  viewsPath: path.join(currentDirname, "../../modules/admin/views"),
  publicPath: path.join(currentDirname, "../../../admin/public"),
};

/* Mongo DB configuration */
export const COLLECTIONS = {
  USERS: "users",
  CONCERTS: "concerts",
  EVENTS: "events",
};
