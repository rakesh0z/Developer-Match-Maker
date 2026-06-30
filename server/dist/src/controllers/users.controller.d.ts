import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
export declare const getCurrentUserProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCurrentUserProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=users.controller.d.ts.map