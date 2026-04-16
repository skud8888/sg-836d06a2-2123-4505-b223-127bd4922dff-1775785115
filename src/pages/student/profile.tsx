import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  BookOpen,
  Loader2,
  Edit,
  Save,
  X,
  Download,
  ExternalLink,
  Clock,
  CheckCircle
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  created_at: string;
  metadata?: any;
}

interface Enrollment {
  id: string;
  status?: string;
  enrolled_at: string;
  course_templates: {
    id: string;
    name: string;
    description: string;
    duration_hours: number;
  };
  scheduled_classes: any;
}

interface Certificate {
  id: string;
  course_id?: string;
  issue_date: string;
  certificate_url?: string;
  course_templates: {
    name: string;
  };
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    date_of_birth: "",
    emergency_contact_name: "",
    emergency_contact_phone: ""
  });

  useEffect(() => {
    loadProfile();
    loadEnrollments();
    loadCertificates();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data as any);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        date_of_birth: (data.metadata as any)?.date_of_birth || "",
        emergency_contact_name: (data.metadata as any)?.emergency_contact_name || "",
        emergency_contact_phone: (data.metadata as any)?.emergency_contact_phone || ""
      });
    } catch (err: any) {
      console.error("Error loading profile:", err);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course_templates (id, name, description, duration_hours),
          scheduled_classes (id, start_date, end_date, location, status)
        `)
        .eq("student_id", user.id)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      setEnrollments((data as any) || []);
    } catch (err: any) {
      console.error("Error loading enrollments:", err);
    }
  };

  const loadCertificates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          course_templates (name)
        `)
        .eq("student_id", user.id)
        .order("issue_date", { ascending: false });

      if (error) throw error;
      setCertificates((data as any) || []);
    } catch (err: any) {
      console.error("Error loading certificates:", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const metadata = {
        ...(profile.metadata || {}),
        date_of_birth: formData.date_of_birth,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          metadata
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: formData.full_name, phone: formData.phone, address: formData.address, metadata });
      setEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        date_of_birth: profile.metadata?.date_of_birth || "",
        emergency_contact_name: profile.metadata?.emergency_contact_name || "",
        emergency_contact_phone: profile.metadata?.emergency_contact_phone || ""
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <>
        <SEO title="My Profile - The Training Hub" />
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="My Profile - The Training Hub"
        description="Manage your student profile and view your courses"
      />

      <Navigation />

      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">My Profile</h1>
              <Link href="/student/portal">
                <Button variant="outline">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground">
              Manage your profile, view your courses, and download certificates
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="certificates">
                <Award className="h-4 w-4 mr-2" />
                Certificates
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your profile details and emergency contact
                      </CardDescription>
                    </div>
                    {!editing ? (
                      <Button onClick={() => setEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Account Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile?.email}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed. Contact support if needed.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Member Since</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile?.created_at
                              ? new Date(profile.created_at).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Personal Details</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          disabled={!editing}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!editing}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          disabled={!editing}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          disabled={!editing}
                          placeholder="Enter your full address"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Emergency Contact</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Contact Name</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                          disabled={!editing}
                          placeholder="Emergency contact name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                        <Input
                          id="emergency_contact_phone"
                          type="tel"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                          disabled={!editing}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Management */}
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4">Security</h3>
                    <Link href="/student/reset-password">
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>
                    View all your enrolled courses and class schedules
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Browse our course catalog to get started
                      </p>
                      <Link href="/courses">
                        <Button>
                          Browse Courses
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  {enrollment.course_templates.name}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                  {enrollment.course_templates.description}
                                </CardDescription>
                              </div>
                              <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                                {enrollment.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{enrollment.course_templates.duration_hours} hours</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                </span>
                              </div>
                              {enrollment.scheduled_classes?.[0] && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{enrollment.scheduled_classes[0].location}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates">
              <Card>
                <CardHeader>
                  <CardTitle>My Certificates</CardTitle>
                  <CardDescription>
                    Download and share your earned certificates
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Complete your courses to earn certificates
                      </p>
                      <Link href="/courses">
                        <Button>
                          View Courses
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {certificates.map((cert) => (
                        <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Award className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">
                                    {cert.course_templates.name}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    Issued {new Date(cert.issue_date).toLocaleDateString()}
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Button className="flex-1" size="sm" asChild>
                                <a href={cert.certificate_url} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}