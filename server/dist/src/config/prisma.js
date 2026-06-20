import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
}
const prisma = new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
});
export default prisma;
//# sourceMappingURL=prisma.js.map