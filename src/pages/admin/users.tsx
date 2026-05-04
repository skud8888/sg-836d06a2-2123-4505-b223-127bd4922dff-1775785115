import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  Mail,
  CheckCircle,
  Clock,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  joined_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  confirmed_at: string | null;
  primary_role: string;
  user_roles: string[];
  avatar_url?: string;
};

const VALID_ROLES = ["super_admin", "admin", "trainer", "receptionist", "student"] as const;

export default function UserManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  
  // Create user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState("student");
  const [creating, setCreating] = useState(false);

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

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (!roleData || !["super_admin", "admin"].includes(roleData.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to manage users",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      await fetchUsers();
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

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from("user_management")
        .select("*")
        .order("joined_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleCreateUser() {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserFullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("User creation failed");

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: newUserRole,
          is_primary: true,
        });

      if (roleError) throw roleError;

      toast({
        title: "User created successfully",
        description: `${newUserEmail} has been added with ${newUserRole} role`,
      });

      setCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRole("student");
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleEditRole() {
    if (!selectedUser || !newRole) return;

    if (!VALID_ROLES.includes(newRole as any)) {
      toast({
        title: "Invalid Role",
        description: `Valid roles: ${VALID_ROLES.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Update primary role
      const { error } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: selectedUser.id,
            role: newRole,
            is_primary: true,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `${selectedUser.email} is now ${newRole}`,
      });

      setEditDialogOpen(false);
      setSelectedUser(null);
      setNewRole("");
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(selectedUser.id);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `${selectedUser.email} has been removed`,
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === "super_admin") return "destructive";
    if (role === "admin") return "default";
    return "secondary";
  };

  const getRoleIcon = (role: string) => {
    if (role === "super_admin") return <Crown className="h-3 w-3" />;
    if (role === "admin") return <Shield className="h-3 w-3" />;
    return null;
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.primary_role.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
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
                <Users className="h-8 w-8 text-primary" />
                User Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.filter((u) => u.primary_role === "admin" || u.primary_role === "super_admin").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trainers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.filter((u) => u.primary_role === "trainer").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.filter((u) => u.primary_role === "student").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                  <CardDescription>View and manage all platform users</CardDescription>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name
                                ? user.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                : user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {user.full_name || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(user.primary_role)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getRoleIcon(user.primary_role)}
                          {user.primary_role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.email_confirmed_at || user.confirmed_at ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.primary_role);
                            setEditDialogOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteDialogOpen(true);
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try a different search term" : "Create your first user"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create User Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user account to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Role Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogDescription>
                  Change the primary role for {selectedUser?.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new_role">New Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
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
                <Button onClick={handleEditRole}>Update Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedUser?.email} and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}