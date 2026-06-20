import type { Request, Response } from "express";
interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}
export declare const githubLogin: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const githubCallback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCurrentUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=auth.controller.d.ts.map