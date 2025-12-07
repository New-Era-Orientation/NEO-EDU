import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { query } from "../services/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { deleteCache } from "../services/cache.js";

export const settingsRouter = Router();

// ============================================
// Types
// ============================================
interface SettingRow {
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
}

// ============================================
// Get All Settings (Admin only)
// ============================================
settingsRouter.get(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await query(`
                SELECT key, value, description, updated_at
                FROM system_settings
                ORDER BY key
            `);

            // Parse JSON values and mask sensitive fields
            const settings = (result.rows as SettingRow[]).map((row) => {
                let parsedValue;
                try {
                    parsedValue = JSON.parse(row.value);
                } catch {
                    parsedValue = row.value;
                }

                // Mask password fields
                if (row.key.includes("pass") || row.key.includes("secret")) {
                    parsedValue = parsedValue ? "********" : "";
                }

                return {
                    key: row.key,
                    value: parsedValue,
                    description: row.description,
                    updated_at: row.updated_at,
                };
            });

            res.json({ settings });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Get Single Setting (Admin only)
// ============================================
settingsRouter.get(
    "/:key",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { key } = req.params;

            const result = await query(
                `SELECT key, value, description, updated_at FROM system_settings WHERE key = $1`,
                [key]
            );

            if (result.rows.length === 0) {
                res.status(404).json({ error: "Setting not found" });
                return;
            }

            const row = result.rows[0] as SettingRow;
            let parsedValue;
            try {
                parsedValue = JSON.parse(row.value);
            } catch {
                parsedValue = row.value;
            }

            res.json({
                setting: {
                    key: row.key,
                    value: parsedValue,
                    description: row.description,
                    updated_at: row.updated_at,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// Update Setting (Admin only)
// ============================================
const updateSettingSchema = z.object({
    value: z.union([z.string(), z.number(), z.boolean()]),
});

settingsRouter.put(
    "/:key",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { key } = req.params;
            const { value } = updateSettingSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            // Check if setting exists
            const existing = await query(
                `SELECT key FROM system_settings WHERE key = $1`,
                [key]
            );

            if (existing.rows.length === 0) {
                res.status(404).json({ error: "Setting not found" });
                return;
            }

            // Update setting
            const jsonValue = JSON.stringify(value);
            await query(
                `UPDATE system_settings 
                 SET value = $1, updated_at = NOW(), updated_by = $2
                 WHERE key = $3`,
                [jsonValue, userId, key]
            );

            // Clear relevant caches
            await deleteCache("settings:*");

            res.json({
                message: "Setting updated",
                setting: { key, value },
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: "Invalid value", details: error.errors });
                return;
            }
            next(error);
        }
    }
);

// ============================================
// Bulk Update Settings (Admin only)
// ============================================
const bulkUpdateSchema = z.object({
    settings: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

settingsRouter.put(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { settings } = bulkUpdateSchema.parse(req.body);
            const userId = (req as Request & { userId: string }).userId;

            for (const [key, value] of Object.entries(settings)) {
                const jsonValue = JSON.stringify(value);
                await query(
                    `UPDATE system_settings 
                     SET value = $1, updated_at = NOW(), updated_by = $2
                     WHERE key = $3`,
                    [jsonValue, userId, key]
                );
            }

            await deleteCache("settings:*");

            res.json({ message: "Settings updated", count: Object.keys(settings).length });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error: "Invalid settings", details: error.errors });
                return;
            }
            next(error);
        }
    }
);

// ============================================
// Test Email Configuration (Admin only)
// ============================================
settingsRouter.post(
    "/email/test",
    authenticate,
    requireRole(["admin"]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { to } = req.body as { to?: string };

            if (!to) {
                res.status(400).json({ error: "Email address required" });
                return;
            }

            // Dynamically import email service to avoid circular deps
            const { sendEmail, isEmailEnabled } = await import("../services/email.js");

            const enabled = await isEmailEnabled();
            if (!enabled) {
                res.status(400).json({ error: "Email service is disabled" });
                return;
            }

            const sent = await sendEmail({
                to,
                subject: "NEO EDU - Test Email",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #6366f1;">Email Configuration Test</h1>
                        <p>This is a test email from NEO EDU.</p>
                        <p>If you received this, your email configuration is working correctly!</p>
                        <p>Sent at: ${new Date().toISOString()}</p>
                    </div>
                `,
            });

            if (sent) {
                res.json({ message: "Test email sent successfully" });
            } else {
                res.status(500).json({ error: "Failed to send test email. Check SMTP configuration." });
            }
        } catch (error) {
            next(error);
        }
    }
);
