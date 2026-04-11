import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { 
  Loader2, 
  UserPlus, 
  Mail, 
  Calendar,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
  Shield
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

export default function TeamManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "trainer"
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/admin/login");
      return;
    }

    setCurrentUserId(session.user.id);

    // Check if user is admin or super_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["super_admin", "admin"])
      .single();

    if (!roleData) {
      router.push("/");
      return;
    }

    loadTeamData();
  };

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_roles!inner(role)
        `)
        .in("user_roles.role", ["super_admin", "admin", "trainer", "receptionist"])
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Transform data
      const members = membersData?.map((m: any) => ({
        id: m.id,
        email: m.email,
        full_name: m.full_name,
        role: m.user_roles.role,
        created_at: m.created_at
      })) || [];

      setTeamMembers(members);

      // Load pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("invitations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (invitationsError) throw invitationsError;

      setInvitations(invitationsData || []);

    } catch (err: any) {
      console.error("Error loading team data:", err);
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteForm.email || !inviteForm.role) {
      setError("Please fill in all fields");
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteForm.email)
        .single();

      if (existingUser) {
        setError("A user with this email already exists");
        setSending(false);
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from("invitations")
        .select("id")
        .eq("email", inviteForm.email)
        .eq("status", "pending")
        .single();

      if (existingInvite) {
        setError("An invitation has already been sent to this email");
        setSending(false);
        return;
      }

      // Generate unique token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Set expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const { error: inviteError } = await supabase
        .from("invitations")
        .insert({
          email: inviteForm.email,
          role: inviteForm.role,
          invited_by: currentUserId,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: "pending"
        });

      if (inviteError) throw inviteError;

      // Send invitation email
      const inviteLink = `${window.location.origin}/admin/signup?token=${token}`;
      
      await emailService.sendEmail(inviteForm.email, {
        subject: "You've been invited to join GTS Training",
        html: `
          <h2>Team Invitation</h2>
          <p>You've been invited to join GTS Training as a <strong>${inviteForm.role}</strong>.</p>
          <p>Click the link below to accept your invitation and create your account:</p>
          <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        `
      });

      setSuccess("Invitation sent successfully!");
      setInviteForm({ email: "", role: "trainer" });
      setDialogOpen(false);

      // Reload data
      loadTeamData();

    } catch (err: any) {
      console.error("Error sending invitation:", err);
      setError(err.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setSending(true);
    setError("");
    setSuccess("");

    try {
      // Get invitation details
      const { data: invitation } = await supabase
        .from("invitations")
        .select("*")
        .eq("id", invitationId)
        .single();

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      // Create invite link
      const inviteLink = `${window.location.origin}/admin/signup?token=${invitation.token}`;
      
      // Resend email
      await emailService.sendEmail(email, {
        subject: "Reminder: You've been invited to join GTS Training",
        html: `
          <h2>Team Invitation Reminder</h2>
          <p>This is a reminder that you've been invited to join GTS Training as a <strong>${invitation.role}</strong>.</p>
          <p>Click the link below to accept your invitation and create your account:</p>
          <p><a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
          <p>This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.</p>
        `
      });

      setSuccess("Invitation resent successfully!");

    } catch (err: any) {
      console.error("Error resending invitation:", err);
      setError(err.message || "Failed to resend invitation");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (deleteError) throw deleteError;

      setSuccess("Invitation deleted successfully!");
      loadTeamData();

    } catch (err: any) {
      console.error("Error deleting invitation:", err);
      setError(err.message || "Failed to delete invitation");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Team Management - GTS Training Admin"
        description="Manage your team members and invitations"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Team Management</h1>
              <p className="text-muted-foreground">
                Invite and manage team members
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation email to add a new team member
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose the appropriate role for this team member
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvitation} disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations sent but not yet accepted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {invitation.role.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteInvitation(invitation.id)}
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
          )}

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                All active team members with access to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || "No name set"}
                        {member.id === currentUserId && (
                          <Badge variant="outline" className="ml-2">You</Badge>
                        )}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role === "super_admin" && <Shield className="h-3 w-3 mr-1" />}
                          {member.role.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {teamMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No team members yet</p>
                  <p className="text-sm">Click "Invite Team Member" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}