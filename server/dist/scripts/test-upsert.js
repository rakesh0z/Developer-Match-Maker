/*
  Neutralized script.
  Previously used for manual Prisma upsert testing.

  This script must NOT run during normal server start or skill sync.
*/
if (require.main === module) {
    // eslint-disable-next-line no-console
    console.log("test-upsert.ts has been neutralized; no DB/GitHub calls will be executed.");
}
export {};
//# sourceMappingURL=test-upsert.js.map