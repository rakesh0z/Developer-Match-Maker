import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
export declare const syncSkills: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSkills: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=skills.controller.d.ts.map