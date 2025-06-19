// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// const sql = neon(process.env.DATABASE_URL!);
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(sql);
