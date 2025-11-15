import {
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const saleSchema = pgTable("sale_table", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  vehicleId: varchar({ length: 255 }).notNull(),
  customerName: varchar().notNull(),
  customerCPF: varchar().notNull(),
  make: varchar({ length: 255 }).notNull(),
  model: varchar().notNull(),
  year: integer("year").notNull(),
  vin: varchar().notNull(),
  color: varchar().notNull(),
  saleDate: timestamp("sale_date").notNull().defaultNow(),
  price: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar({ length: 20 }).notNull().default("pending"),
});
