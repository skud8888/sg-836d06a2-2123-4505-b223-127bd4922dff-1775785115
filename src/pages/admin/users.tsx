import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { rbacService, type UserRole } from "@/services/rbacService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, UserPlus, Shield, Trash2, Mail, KeyRound, Edit, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
  last_sign_in?: string;
  is_banned?: boolean;
};

type DialogType = "roles" | "create" | "edit" | "reset" | null;

export default function UsersManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "" as UserRole | ""
  });

  const [editForm, setEditForm] = useState({
    email: "",
    full_name: ""
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    checkPermissions();
    fetchUsers();
  }, []);

  const checkPermissions = async () => {
    const canManageUsers = await rbacService.hasPermission("users", "read");
    if (!canManageUsers) {
      router.push("/admin");
      return;
    }

    const superAdmin = await rbacService.isSuperAdmin();
    setIsSuperAdmin(superAdmin);
  };

  const fetchUsers = async () => {
    setLoading(true);

    try {
      // Get all users from profiles table with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all role assignments
      const { data: roleAssignments, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Map users with their roles
      const usersWithRoles = (profilesData || []).map(user => ({
        id: user.id,
        email: user.email || "",
        full_name: user.full_name || null,
        created_at: user.created_at,
        roles: roleAssignments?.filter(r => r.user_id === user.id).map(r => r.role) || []
      }));

      setUsers(usersWithRoles);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      // Create user via Supabase Auth Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: createForm.email,
        password: createForm.password,
        email_confirm: true,
        user_metadata: {
          full_name: createForm.full_name || createForm.email
        }
      });

      if (error) throw error;

      // Assign role if selected
      if (createForm.role && data.user) {
        await rbacService.assignRole(data.user.id, createForm.role);
      }

      toast({ title: "User created successfully" });
      setDialogType(null);
      setCreateForm({ email: "", password: "", full_name: "", role: "" });
      fetchUsers();
    } catch (err: any) {
      console.error("Error creating user:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        {
          email: editForm.email,
          user_metadata: {
            full_name: editForm.full_name
          }
        }
      );

      if (updateError) throw updateError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: editForm.email,
          full_name: editForm.full_name
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      toast({ title: "User updated successfully" });
      setDialogType(null);
      fetchUsers();
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (resetPasswordForm.newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        { password: resetPasswordForm.newPassword }
      );

      if (error) throw error;

      toast({ title: "Password reset successfully" });
      setDialogType(null);
      setResetPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      console.error("Error resetting password:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setActionLoading(true);
    try {
      // Delete user via Supabase Auth Admin API
      const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);

      if (error) throw error;

      toast({ title: "User deleted successfully" });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPasswordReset = async (userEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/admin/update-password`
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: `Reset link sent to ${userEmail}`
      });
    } catch (err: any) {
      console.error("Error sending password reset:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to send password reset email",
        variant: "destructive"
      });
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    setActionLoading(true);
    const { success, error } = await rbacService.assignRole(selectedUser.id, newRole);

    if (success) {
      toast({ title: "Role assigned successfully" });
      setNewRole("");
      fetchUsers();
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to assign role",
        variant: "destructive"
      });
    }
    setActionLoading(false);
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setActionLoading(true);
    const { success, error } = await rbacService.removeRole(userId, role as UserRole);

    if (success) {
      toast({ title: "Role removed successfully" });
      fetchUsers();
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove role",
        variant: "destructive"
      });
    }
    setActionLoading(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-500 text-white";
      case "admin":
        return "bg-blue-500 text-white";
      case "trainer":
        return "bg-green-500 text-white";
      case "receptionist":
        return "bg-purple-500 text-white";
      case "student":
        return "bg-gray-500 text-white";
      default:
        return "";
    }
  };

  const openDialog = (type: DialogType, user?: User) => {
    setDialogType(type);
    if (user) {
      setSelectedUser(user);
      if (type === "edit") {
        setEditForm({
          email: user.email,
          full_name: user.full_name || ""
        });
      }
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => openDialog("create")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>{filteredUsers.length} total users</CardDescription>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          {user.full_name && (
                            <p className="text-sm text-muted-foreground">{user.full_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} className={getRoleBadgeColor(role)}>
                                {role.replace("_", " ")}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No roles</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {isSuperAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDialog("roles", user)}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Roles
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDialog("edit", user)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDialog("reset", user)}
                              >
                                <KeyRound className="h-4 w-4 mr-1" />
                                Reset
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendPasswordReset(user.email)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={dialogType === "create"} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system and assign an initial role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="create-role">Initial Role (optional)</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={actionLoading}>
              {actionLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={dialogType === "edit"} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={dialogType === "reset"} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={resetPasswordForm.newPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={actionLoading}>
              {actionLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={dialogType === "roles"} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign or remove roles for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Current Roles</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUser?.roles.map((role) => (
                  <Badge
                    key={role}
                    className={`${getRoleBadgeColor(role)} cursor-pointer`}
                    onClick={() => handleRemoveRole(selectedUser.id, role)}
                  >
                    {role.replace("_", " ")}
                    <Trash2 className="h-3 w-3 ml-2" />
                  </Badge>
                ))}
                {selectedUser?.roles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No roles assigned</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="role">Assign New Role</Label>
              <div className="flex gap-2 mt-2">
                <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignRole} disabled={!newRole || actionLoading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Role Permissions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><strong>Super Admin:</strong> Full system access, manage users</li>
                <li><strong>Admin:</strong> Manage bookings, courses, view analytics</li>
                <li><strong>Trainer:</strong> View assigned classes, update attendance</li>
                <li><strong>Receptionist:</strong> Create bookings, accept payments</li>
                <li><strong>Student:</strong> View own bookings and documents</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{userToDelete?.email}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}