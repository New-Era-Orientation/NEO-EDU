import nodemailer, { type Transporter } from "nodemailer";
import { query } from "./db.js";

// ============================================
// Types
// ============================================
interface EmailConfig {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    pass: string;
    fromAddress: string;
    fromName: string;
}

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// ============================================
// Get Email Settings from Database
// ============================================
async function getEmailConfig(): Promise<EmailConfig> {
    const result = await query(`
        SELECT key, value FROM system_settings 
        WHERE key LIKE 'email_%'
    `);

    const settings: Record<string, string> = {};
    for (const row of result.rows as Array<{ key: string; value: string }>) {
        // Remove the 'email_' prefix for cleaner access
        const cleanKey = row.key.replace("email_", "");
        // Parse JSON value
        try {
            settings[cleanKey] = JSON.parse(row.value as string);
        } catch {
            settings[cleanKey] = row.value;
        }
    }

    return {
        enabled: String(settings.enabled) === "true",
        host: settings.smtp_host || "",
        port: parseInt(String(settings.smtp_port)) || 587,
        user: settings.smtp_user || "",
        pass: settings.smtp_pass || "",
        fromAddress: settings.from_address || "noreply@neoedu.vn",
        fromName: settings.from_name || "NEO EDU",
    };
}

// ============================================
// Create Transporter (lazy initialization)
// ============================================
let transporter: Transporter | null = null;
let lastConfig: string = "";

async function getTransporter(): Promise<Transporter | null> {
    const config = await getEmailConfig();

    if (!config.enabled) {
        return null;
    }

    if (!config.host || !config.user || !config.pass) {
        console.warn("Email service enabled but not configured properly");
        return null;
    }

    // Check if config changed - recreate transporter if needed
    const configHash = JSON.stringify({
        host: config.host,
        port: config.port,
        user: config.user,
    });

    if (transporter && lastConfig === configHash) {
        return transporter;
    }

    transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    lastConfig = configHash;
    console.log("✅ Email transporter initialized");

    return transporter;
}

// ============================================
// Send Email Function
// ============================================
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        const config = await getEmailConfig();

        if (!config.enabled) {
            console.log(`📧 Email disabled - would send to: ${options.to}`);
            return false;
        }

        const transport = await getTransporter();
        if (!transport) {
            console.warn("Email transporter not available");
            return false;
        }

        await transport.sendMail({
            from: `"${config.fromName}" <${config.fromAddress}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        console.log(`📧 Email sent to: ${options.to}`);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}

// ============================================
// Email Templates
// ============================================
export const emailTemplates = {
    welcome: (name: string) => ({
        subject: "Welcome to NEO EDU!",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">Welcome to NEO EDU!</h1>
                <p>Hi ${name},</p>
                <p>Thank you for joining NEO EDU. We're excited to have you on board!</p>
                <p>Start exploring our courses and exams to enhance your learning journey.</p>
                <br>
                <p>Best regards,<br>The NEO EDU Team</p>
            </div>
        `,
    }),

    passwordReset: (name: string, resetLink: string) => ({
        subject: "Reset Your Password - NEO EDU",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">Password Reset Request</h1>
                <p>Hi ${name},</p>
                <p>We received a request to reset your password. Click the button below to proceed:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Reset Password
                    </a>
                </p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
                <br>
                <p>Best regards,<br>The NEO EDU Team</p>
            </div>
        `,
    }),

    examResult: (name: string, examTitle: string, score: number, passed: boolean) => ({
        subject: `Exam Result: ${examTitle} - NEO EDU`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">Exam Result</h1>
                <p>Hi ${name},</p>
                <p>Here are your results for <strong>${examTitle}</strong>:</p>
                <div style="background: ${passed ? "#dcfce7" : "#fee2e2"}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <div style="font-size: 48px; font-weight: bold; color: ${passed ? "#16a34a" : "#dc2626"};">
                        ${score}%
                    </div>
                    <div style="font-size: 24px; color: ${passed ? "#16a34a" : "#dc2626"};">
                        ${passed ? "PASSED ✓" : "NOT PASSED"}
                    </div>
                </div>
                <p>${passed ? "Congratulations on passing the exam!" : "Don't worry, you can try again. Keep learning!"}</p>
                <br>
                <p>Best regards,<br>The NEO EDU Team</p>
            </div>
        `,
    }),
};

// ============================================
// Check Email Service Status
// ============================================
export async function isEmailEnabled(): Promise<boolean> {
    const config = await getEmailConfig();
    return config.enabled;
}
