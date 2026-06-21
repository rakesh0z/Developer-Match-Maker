import cron from "node-cron";
import { syncIssues } from "../services/issueSync.service.js";
cron.schedule("*/30 * * * *", async () => {
    try {
        console.log("Sync started");
        await syncIssues();
    }
    catch (e) {
        console.error("Sync failed", e);
    }
});
//# sourceMappingURL=syncIssues.js.map