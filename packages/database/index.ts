import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Neon's serverless driver uses HTTP, avoiding TCP cold-start overhead in production.
// Self-hosted instances talk to a plain Postgres over TCP, so DATABASE_DRIVER=pg
// selects the standard pg adapter regardless of NODE_ENV.
const useNeon =
  process.env.NODE_ENV === "production" && process.env.DATABASE_DRIVER !== "pg";

const adapter = useNeon
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export { prisma };
