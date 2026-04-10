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
import { ArrowLeft, Search, UserPlus, Shield, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type User = {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
};

export default function UsersManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching users:", authError);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Get all role assignments
    const { data: roleAssignments } = await supabase
      .from("user_roles")
      .select("*");

    // Map users with their roles
    const usersWithRoles = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || "",
      created_at: user.created_at,
      roles: roleAssignments?.filter(r => r.user_id === user.id).map(r => r.role) || []
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    const { success, error } = await rbacService.assignRole(selectedUser.id, newRole);

    if (success) {
      toast({ title: "Role assigned successfully" });
      setDialogOpen(false);
      setNewRole("");
      fetchUsers();
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to assign role",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
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

  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                className={getRoleBadgeColor(role)}
                              >
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
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <Button onClick={handleAssignRole} disabled={!newRole}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}