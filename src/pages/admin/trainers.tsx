import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Mail, Phone, Calendar, Award } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Trainers() {
  const router = useRouter();
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Profile | null>(null);
  
  const [formData, setFormData] = useState<{
    email: string;
    full_name: string;
    role: "trainer" | "admin";
    phone: string;
  }>({
    email: "",
    full_name: "",
    role: "trainer",
    phone: ""
  });

  useEffect(() => {
    checkAuth();
    fetchTrainers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
    }
  };

  const fetchTrainers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["admin", "trainer"])
      .order("full_name");

    console.log("Fetched trainers:", { data, error });

    if (data) {
      setTrainers(data);
    }
    setLoading(false);
  };

  const handleOpenDialog = (trainer?: Profile) => {
    if (trainer) {
      setEditingTrainer(trainer);
      setFormData({
        email: trainer.email || "",
        full_name: trainer.full_name || "",
        role: trainer.role as "trainer" | "admin",
        phone: trainer.phone || ""
      });
    } else {
      setEditingTrainer(null);
      setFormData({
        email: "",
        full_name: "",
        role: "trainer",
        phone: ""
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTrainer) {
      // Update existing trainer
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null
        })
        .eq("id", editingTrainer.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Trainer updated successfully" });
        setDialogOpen(false);
        fetchTrainers();
      }
    } else {
      // For new trainers, they need to sign up themselves
      // This just shows a message
      toast({
        title: "New Trainer Setup",
        description: "Send the trainer a signup link to create their account. You can then update their role to 'trainer'.",
      });
      setDialogOpen(false);
    }
  };

  const getTrainerStats = async (trainerId: string) => {
    const { data } = await supabase
      .from("scheduled_classes")
      .select("id")
      .eq("trainer_id", trainerId);
    
    return data?.length || 0;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">Trainer Management</h1>
            <p className="text-muted-foreground">Manage trainer profiles and assignments</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trainer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTrainer ? "Edit Trainer Profile" : "Add New Trainer"}
                </DialogTitle>
                <DialogDescription>
                  {editingTrainer ? "Update trainer details" : "Invite a new trainer to the platform"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingTrainer}
                    placeholder="trainer@example.com"
                  />
                  {!editingTrainer && (
                    <p className="text-xs text-muted-foreground">
                      The trainer must sign up with this email first
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0400 000 000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as "trainer" | "admin" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTrainer ? "Update Trainer" : "Add Trainer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading trainers...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trainers.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No trainers found. Add your first trainer to get started.
                </CardContent>
              </Card>
            ) : (
              trainers.map((trainer) => (
                <Card key={trainer.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">
                            {trainer.full_name || "Unnamed Trainer"}
                          </CardTitle>
                          <Badge variant={trainer.role === "admin" ? "default" : "secondary"}>
                            {trainer.role}
                          </Badge>
                        </div>
                        <CardDescription>{trainer.email}</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(trainer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trainer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{trainer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{trainer.email}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Quick Stats</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Classes assigned</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Active trainer</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}