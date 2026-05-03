import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { Flag, Plus, Edit, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function FeatureFlags() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    enabled: false
  });

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
          description: "You don't have permission to manage feature flags",
          variant: "destructive",
        });
        router.push("/admin");
        return;
      }

      await loadFlags();
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

  async function loadFlags() {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("name");

      if (error) throw error;
      setFlags(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading feature flags",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function toggleFlag(flag: FeatureFlag) {
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ 
          enabled: !flag.enabled,
          updated_at: new Date().toISOString()
        })
        .eq("id", flag.id);

      if (error) throw error;

      toast({
        title: "Feature flag updated",
        description: `${flag.name} is now ${!flag.enabled ? "enabled" : "disabled"}`,
      });

      await loadFlags();
    } catch (error: any) {
      toast({
        title: "Error updating feature flag",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingFlag) {
        const { error } = await supabase
          .from("feature_flags")
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingFlag.id);

        if (error) throw error;

        toast({
          title: "Feature flag updated",
          description: "Feature flag has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("feature_flags")
          .insert({
            key: formData.key,
            name: formData.name,
            description: formData.description,
            enabled: formData.enabled
          });

        if (error) throw error;

        toast({
          title: "Feature flag created",
          description: "New feature flag has been added",
        });
      }

      setDialogOpen(false);
      setEditingFlag(null);
      setFormData({ key: "", name: "", description: "", enabled: false });
      await loadFlags();
    } catch (error: any) {
      toast({
        title: "Error saving feature flag",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const enabledCount = flags.filter(f => f.enabled).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading feature flags...</p>
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
                <Flag className="h-8 w-8 text-primary" />
                Feature Flags
              </h1>
              <p className="text-muted-foreground mt-2">
                Control feature availability across the platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadFlags}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingFlag(null);
                    setFormData({ key: "", name: "", description: "", enabled: false });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature Flag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingFlag ? "Edit Feature Flag" : "Add Feature Flag"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingFlag 
                          ? "Update the feature flag details" 
                          : "Create a new feature flag to control feature availability"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {!editingFlag && (
                        <div className="space-y-2">
                          <Label htmlFor="key">Key *</Label>
                          <Input
                            id="key"
                            placeholder="feature_name"
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            required
                            disabled={!!editingFlag}
                          />
                          <p className="text-xs text-muted-foreground">
                            Unique identifier (lowercase, underscores only)
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Feature Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what this feature flag controls"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      {!editingFlag && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enabled"
                            checked={formData.enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                          />
                          <Label htmlFor="enabled">Enable by default</Label>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingFlag ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{flags.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Enabled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{enabledCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-600" />
                  Disabled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">{flags.length - enabledCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Flags Table */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Manage feature availability across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell className="font-medium">{flag.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {flag.key}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-md text-sm text-muted-foreground">
                        {flag.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={flag.enabled ? "default" : "secondary"}>
                          {flag.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(flag.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={() => toggleFlag(flag)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingFlag(flag);
                              setFormData({
                                key: flag.key,
                                name: flag.name,
                                description: flag.description,
                                enabled: flag.enabled
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}