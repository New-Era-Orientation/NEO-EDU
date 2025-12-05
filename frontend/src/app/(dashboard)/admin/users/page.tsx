"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2
} from "lucide-react";
import {
    Button,
    Input,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Avatar,
    Badge
} from "@/components/ui";
import { api, type User } from "@/lib/api";
import { useDebounce } from "@/lib/hooks";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("");

    // Create/Edit/Delete states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "student",
        password: "",
        must_change_password: true
    });

    const debouncedSearch = useDebounce(search, 500);

    // Fetch users
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await api.getUsers({
                page,
                limit: 10,
                search: debouncedSearch,
                role: roleFilter || undefined
            });
            setUsers(data.users);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch, roleFilter]);

    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createUser(formData);
            setIsCreateOpen(false);
            setFormData({ name: "", email: "", role: "student", password: "", must_change_password: true });
            fetchUsers();
            alert("User created successfully");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create user");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const updateData: any = { ...formData };
            if (!updateData.password) delete updateData.password; // Don't send empty password

            await api.updateUser(editingUser.id, updateData);
            setEditingUser(null);
            setFormData({ name: "", email: "", role: "student", password: "", must_change_password: true });
            fetchUsers();
            alert("User updated successfully");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update user");
        }
    };

    const handleDelete = async () => {
        if (!deletingUserId) return;
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            await api.deleteUser(deletingUserId);
            setDeletingUserId(null);
            fetchUsers();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete user");
        }
    };

    // Open Modal Helpers
    const openCreate = () => {
        setFormData({ name: "", email: "", role: "student", password: "", must_change_password: true });
        setIsCreateOpen(true);
    };

    const openEdit = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: "",
            must_change_password: false
        });
        setEditingUser(user);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage users, roles and permissions
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="w-4 h-4" /> Add User
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        className="h-10 px-3 rounded-md border bg-background text-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">User</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Role</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Joined</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        className="w-8 h-8"
                                                        src={user.avatar}
                                                        fallback={user.name?.charAt(0) || "?"}
                                                    />
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={
                                                    user.role === 'admin' ? "destructive" :
                                                        user.role === 'instructor' ? "default" :
                                                            "secondary"
                                                } className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(user.createdAt || "").toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeletingUserId(user.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination Controls could go here */}

            {/* Create/Edit Modal (Simple Overlay for now) */}
            {(isCreateOpen || editingUser) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle>{editingUser ? "Edit User" : "Create User"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border bg-background"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password {editingUser && "(Leave blank to keep current)"}</label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        minLength={8}
                                    />
                                </div>
                                {!editingUser && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="must_change"
                                            checked={formData.must_change_password}
                                            onChange={e => setFormData({ ...formData, must_change_password: e.target.checked })}
                                        />
                                        <label htmlFor="must_change" className="text-sm">User must change password on login</label>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingUser ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
