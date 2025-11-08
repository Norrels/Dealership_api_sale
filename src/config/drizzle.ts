import { defineConfig } from "drizzle-kit";
import { config } from "./env";

export default defineConfig({
  out: "./src/infrastructure/database/drizzle",
  schema: "./src/infrastructure/database/schemas/*",
  dialect: "postgresql",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
