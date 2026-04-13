import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/auditService";
import { Navigation } from "@/components/Navigation";
import { 
  Users, Search, Shield, MoreVertical, Key, Trash2, 
  UserPlus, Mail, ShieldAlert, CheckSquare, XSquare,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  
  // Create User State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", fullName: "", role: "student" });
  
  // Role Dialog State
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<Profile | null>(null);

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  const checkAccessAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .single();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "Super Admin privileges required.",
          variant: "destructive"
        });
        router.push("/admin");
        return;
      }

      await fetchUsers();
    } catch (err) {
      console.error("Access check error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const combinedUsers = profilesData.map((profile) => ({
        ...profile,
        roles: rolesData
          .filter(r => r.user_id === profile.id)
          .map(r => r.role)
      }));

      setUsers(combinedUsers);
      setSelectedUsers([]);
    } catch (error: any) {
      console.error("Error loading users:", error);
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
    if (!createForm.email || !createForm.password) return;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            full_name: createForm.fullName
          }
        }
      });

      if (error) throw error;
      
      if (data.user && createForm.role !== "student") {
        await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: createForm.role });
      }

      await auditService.logUserCreated(data.user?.id || "", createForm.email, [createForm.role]);

      toast({ title: "User created successfully" });
      setIsCreateOpen(false);
      setCreateForm({ email: "", password: "", fullName: "", role: "student" });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
      
      const user = users.find(u => u.id === userId);
      if (user) await auditService.logRoleAssigned(userId, user.email || "", role);

      toast({ title: "Role assigned" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .match({ user_id: userId, role });

      if (error) throw error;

      const user = users.find(u => u.id === userId);
      if (user) await auditService.logRoleRemoved(userId, user.email || "", role);

      toast({ title: "Role removed" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // BULK ACTIONS
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleBulkRoleAssign = async (role: string) => {
    if (selectedUsers.length === 0) return;
    try {
      for (const userId of selectedUsers) {
        // Skip if they already have the role
        const user = users.find(u => u.id === userId);
        if (user && !user.roles.includes(role)) {
          await supabase.from("user_roles").insert({ user_id: userId, role });
        }
      }
      
      await auditService.logBulkAction("role_assign", selectedUsers.length, `Assigned role ${role} to multiple users`);
      
      toast({ title: "Bulk role assignment successful" });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
              <p className="text-slate-500 mt-1">Manage system access, roles, and permissions</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white pb-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by email, name, or role..." 
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                      {selectedUsers.length} selected
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-700">
                          Bulk Actions <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleBulkRoleAssign("admin")}>
                          Assign Admin Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkRoleAssign("trainer")}>
                          Assign Trainer Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 font-medium">
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[50px] pl-4">
                      <Checkbox 
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User Details</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 group">
                        <TableCell className="pl-4">
                          <Checkbox 
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            aria-label={`Select ${user.email}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{user.full_name || "No Name"}</span>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-slate-500">Student</Badge>
                            ) : (
                              user.roles.map(role => (
                                <Badge 
                                  key={role} 
                                  variant="secondary"
                                  className={
                                    role === 'super_admin' ? "bg-red-100 text-red-800 hover:bg-red-200" :
                                    role === 'admin' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                                    role === 'trainer' ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                    "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                  }
                                >
                                  {role.replace('_', ' ')}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedUserForRoles(user);
                                setIsRoleDialogOpen(true);
                              }}>
                                <Shield className="h-4 w-4 mr-2" />
                                Manage Roles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Management Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign or remove roles for {selectedUserForRoles?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Select onValueChange={(val) => handleAssignRole(selectedUserForRoles?.id || "", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Add new role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-slate-700">Current Roles</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUserForRoles?.roles.map(role => (
                  <Badge 
                    key={role} 
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleRemoveRole(selectedUserForRoles.id, role)}
                  >
                    {role.replace('_', ' ')}
                    <span className="ml-1 text-slate-500 hover:text-red-500">×</span>
                  </Badge>
                ))}
                {selectedUserForRoles?.roles.length === 0 && (
                  <span className="text-sm text-slate-500 italic">No special roles (Student access only)</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">Click a role badge to remove it.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account instantly. They won't need to verify their email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email" 
                value={createForm.email}
                onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={createForm.fullName}
                onChange={(e) => setCreateForm({...createForm, fullName: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input 
                type="password" 
                value={createForm.password}
                onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Initial Role</Label>
              <Select 
                value={createForm.role}
                onValueChange={(val) => setCreateForm({...createForm, role: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student (No special access)</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} className="bg-indigo-600 hover:bg-indigo-700">
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}