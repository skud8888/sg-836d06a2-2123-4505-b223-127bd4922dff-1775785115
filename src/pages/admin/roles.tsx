import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { checkPermission, getRolePermissions, Role, Permission } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, Edit, Trash2, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: Role;
  assigned_at: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

const ROLE_COLORS: Record<Role, string> = {
  super_admin: "bg-purple-500",
  admin: "bg-blue-500",
  trainer: "bg-green-500",
  receptionist: "bg-yellow-500",
  student: "bg-gray-500"
};

export default function AdminRoleManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [newRole, setNewRole] = useState<Role>("student");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserRole, setAddUserRole] = useState<Role>("student");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const canManageRoles = await checkPermission("manage_team");
      
      if (!canManageRoles) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to manage roles",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      await loadUserRoles();
    } catch (error: any) {
      console.error("Access check error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadUserRoles() {
    try {
      // Fetch user_roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (rolesError) throw rolesError;
      
      if (!rolesData || rolesData.length === 0) {
        setUserRoles([]);
        return;
      }

      // Fetch profiles
      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const combinedData: UserRole[] = rolesData.map((role: any) => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role as Role,
        assigned_at: role.assigned_at || new Date().toISOString(),
        profiles: profilesMap.get(role.user_id) || { email: "Unknown", full_name: "Unknown" }
      }));

      setUserRoles(combinedData);
    } catch (error: any) {
      toast({
        title: "Error loading roles",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleUpdateRole() {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}`,
      });

      setEditDialogOpen(false);
      await loadUserRoles();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteRole() {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: "User role has been removed",
      });

      setDeleteDialogOpen(false);
      await loadUserRoles();
    } catch (error: any) {
      toast({
        title: "Error removing role",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleAddUserRole() {
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", addUserEmail)
        .single();

      if (profileError || !profile) {
        toast({
          title: "User Not Found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        return;
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .single();

      if (existingRole) {
        toast({
          title: "Role Already Exists",
          description: "This user already has a role assigned",
          variant: "destructive",
        });
        return;
      }

      // Add new role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.id,
          role: addUserRole
        });

      if (error) throw error;

      toast({
        title: "Role Added",
        description: `${addUserRole} role assigned to ${addUserEmail}`,
      });

      setAddDialogOpen(false);
      setAddUserEmail("");
      setAddUserRole("student");
      await loadUserRoles();
    } catch (error: any) {
      toast({
        title: "Error adding role",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const filteredRoles = userRoles.filter(ur => 
    ur.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ur.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ur.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = {
    super_admin: userRoles.filter(ur => ur.role === "super_admin").length,
    admin: userRoles.filter(ur => ur.role === "admin").length,
    trainer: userRoles.filter(ur => ur.role === "trainer").length,
    receptionist: userRoles.filter(ur => ur.role === "receptionist").length,
    student: userRoles.filter(ur => ur.role === "student").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading roles...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Role Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage user roles and permissions across the platform
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add User Role</DialogTitle>
                  <DialogDescription>
                    Assign a role to an existing user by their email address
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">User Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="user@example.com"
                      value={addUserEmail}
                      onChange={(e) => setAddUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">Role</Label>
                    <Select value={addUserRole} onValueChange={(value: Role) => setAddUserRole(value)}>
                      <SelectTrigger id="user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUserRole}>Add Role</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Role Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(roleStats).map(([role, count]) => (
              <Card key={role}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${ROLE_COLORS[role as Role]}`} />
                    {role.replace('_', ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>
                {filteredRoles.length} users with assigned roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.profiles?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{userRole.profiles?.email}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[userRole.role]}>
                          {userRole.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {getRolePermissions(userRole.role).length} permissions
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(userRole.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(userRole);
                              setNewRole(userRole.role);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(userRole);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Permissions Reference */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
              <CardDescription>
                Overview of permissions granted to each role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(["super_admin", "admin", "trainer", "receptionist", "student"] as Role[]).map((role) => {
                  const permissions = getRolePermissions(role);
                  return (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={ROLE_COLORS[role]}>
                        {role.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {permissions.length} permissions
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                        >
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {permission.replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Edit Role Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogDescription>
                  Change the role for {selectedUser?.profiles?.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">New Role</Label>
                  <Select value={newRole} onValueChange={(value: Role) => setNewRole(value)}>
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRole}>Update Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove User Role?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the {selectedUser?.role} role from {selectedUser?.profiles?.email}.
                  They will lose all associated permissions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground">
                  Remove Role
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}