import { type Request, type Response, type NextFunction } from "express";
declare module "express" {
    interface Request {
        userId?: string;
        userRole?: string;
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map