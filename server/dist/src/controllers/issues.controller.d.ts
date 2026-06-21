import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
export declare const manualSyncIssues: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getIssues: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=issues.controller.d.ts.map