import { serve } from "bun";
import index from "./index.html";
import rerecord from "./rerecord.html";

const server = serve({
  hostname: "0.0.0.0",
  routes: {
    // Serve rerecord.html for measurement app routes
    "/rerecord/*": rerecord,
    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
