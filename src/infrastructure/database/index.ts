import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../../config/env";

export const db = drizzle(config.DATABASE_URL!);
