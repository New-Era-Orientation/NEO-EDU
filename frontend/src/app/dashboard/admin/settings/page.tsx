"use client";

import { useState, useEffect } from "react";
import {
    Loader2,
    Save,
    Mail,
    Settings,
    Server,
    Send,
    CheckCircle,
    XCircle
} from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Label,
    Badge
} from "@/components/ui";
import { api, type SystemSetting } from "@/lib/api";

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [isTesting, setIsTesting] = useState(false);

    // Local form state
    const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const data = await api.getSettings();
            setSettings(data.settings);

            // Initialize form values
            const values: Record<string, string | number | boolean> = {};
            for (const setting of data.settings) {
                values[setting.key] = setting.value;
            }
            setFormValues(values);
        } catch (error) {
            console.error(error);
            alert("Failed to load settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleValueChange = (key: string, value: string | number | boolean) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.updateSettings(formValues);
            alert("Settings saved successfully");
            fetchSettings();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            alert("Please enter an email address");
            return;
        }

        try {
            setIsTesting(true);
            await api.testEmailConfig(testEmail);
            alert("Test email sent successfully!");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to send test email");
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Group settings by prefix
    const emailSettings = settings.filter((s) => s.key.startsWith("email_"));
    const siteSettings = settings.filter((s) => !s.key.startsWith("email_"));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure platform features</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Changes
                </Button>
            </div>

            {/* Site Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Site Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {siteSettings.map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                            <div className="flex-1">
                                <div className="font-medium">{formatSettingName(setting.key)}</div>
                                {setting.description && (
                                    <div className="text-xs text-muted-foreground">{setting.description}</div>
                                )}
                            </div>
                            {typeof setting.value === "boolean" || setting.key.includes("mode") ? (
                                <Button
                                    variant={formValues[setting.key] === true || formValues[setting.key] === "true" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        handleValueChange(
                                            setting.key,
                                            !(formValues[setting.key] === true || formValues[setting.key] === "true")
                                        )
                                    }
                                >
                                    {formValues[setting.key] === true || formValues[setting.key] === "true" ? (
                                        <><CheckCircle className="w-4 h-4 mr-1" /> Enabled</>
                                    ) : (
                                        <><XCircle className="w-4 h-4 mr-1" /> Disabled</>
                                    )}
                                </Button>
                            ) : (
                                <Input
                                    className="max-w-[200px]"
                                    value={String(formValues[setting.key] || "")}
                                    onChange={(e) => handleValueChange(setting.key, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Settings
                        <Badge variant={formValues["email_enabled"] === true || formValues["email_enabled"] === "true" ? "default" : "secondary"}>
                            {formValues["email_enabled"] === true || formValues["email_enabled"] === "true" ? "Enabled" : "Disabled"}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between py-2 border-b">
                        <div>
                            <div className="font-medium">Email Service</div>
                            <div className="text-xs text-muted-foreground">Enable/disable sending emails</div>
                        </div>
                        <Button
                            variant={formValues["email_enabled"] === true || formValues["email_enabled"] === "true" ? "default" : "outline"}
                            onClick={() =>
                                handleValueChange(
                                    "email_enabled",
                                    !(formValues["email_enabled"] === true || formValues["email_enabled"] === "true")
                                )
                            }
                        >
                            {formValues["email_enabled"] === true || formValues["email_enabled"] === "true" ? (
                                <><CheckCircle className="w-4 h-4 mr-1" /> Enabled</>
                            ) : (
                                <><XCircle className="w-4 h-4 mr-1" /> Disabled</>
                            )}
                        </Button>
                    </div>

                    {/* SMTP Config */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                <Server className="w-4 h-4" /> SMTP Host
                            </Label>
                            <Input
                                placeholder="smtp.example.com"
                                value={String(formValues["email_smtp_host"] || "")}
                                onChange={(e) => handleValueChange("email_smtp_host", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <Input
                                type="number"
                                placeholder="587"
                                value={String(formValues["email_smtp_port"] || "587")}
                                onChange={(e) => handleValueChange("email_smtp_port", parseInt(e.target.value) || 587)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Username</Label>
                            <Input
                                placeholder="user@example.com"
                                value={String(formValues["email_smtp_user"] || "")}
                                onChange={(e) => handleValueChange("email_smtp_user", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Password</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={String(formValues["email_smtp_pass"] || "")}
                                onChange={(e) => handleValueChange("email_smtp_pass", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>From Email</Label>
                            <Input
                                placeholder="noreply@neoedu.vn"
                                value={String(formValues["email_from_address"] || "")}
                                onChange={(e) => handleValueChange("email_from_address", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>From Name</Label>
                            <Input
                                placeholder="NEO EDU"
                                value={String(formValues["email_from_name"] || "")}
                                onChange={(e) => handleValueChange("email_from_name", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Test Email */}
                    <div className="border-t pt-4">
                        <div className="font-medium mb-2">Test Email Configuration</div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="test@example.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="max-w-[300px]"
                            />
                            <Button variant="outline" onClick={handleTestEmail} disabled={isTesting} className="gap-1">
                                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Test
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function formatSettingName(key: string): string {
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
