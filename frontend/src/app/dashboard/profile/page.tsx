"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Camera } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Avatar,
    LoadingPage,
} from "@/components/ui";
import { useAuthStore } from "@/stores";
import { useProfile, useUpdateProfile } from "@/lib/hooks";

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { data, isLoading } = useProfile();
    const updateProfile = useUpdateProfile();
    const router = useRouter();

    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState("");

    if (isLoading) {
        return <LoadingPage />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile.mutateAsync({ name, bio });
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your personal information
                </p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar
                                    src={user?.avatar}
                                    fallback={user?.name}
                                    size="xl"
                                />
                                <button
                                    type="button"
                                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div>
                                <h3 className="font-medium">{user?.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {user?.role}
                                </p>
                            </div>
                        </div>

                        {/* Name */}
                        <Input
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            leftIcon={<User className="w-4 h-4" />}
                        />

                        {/* Email (read-only) */}
                        <Input
                            label="Email Address"
                            value={user?.email || ""}
                            disabled
                            leftIcon={<Mail className="w-4 h-4" />}
                        />

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                isLoading={updateProfile.isPending}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
