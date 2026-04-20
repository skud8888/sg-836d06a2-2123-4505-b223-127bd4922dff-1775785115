import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProfileSkeleton } from "@/components/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { socialProfileService } from "@/services/socialProfileService";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Award,
  BookOpen,
  Share2,
  Edit,
  Save,
  Loader2,
  Trophy,
  Star,
} from "lucide-react";

export default function SocialProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    is_public: false,
    show_achievements: true,
    show_courses: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/student/portal");
        return;
      }

      setUser(user);
      await loadProfile(user.id);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/student/portal");
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);

      // Load profile
      const { profile: existingProfile } = await socialProfileService.getProfile(userId);
      
      if (existingProfile) {
        setProfile(existingProfile);
        setFormData({
          display_name: existingProfile.display_name || "",
          bio: existingProfile.bio || "",
          avatar_url: existingProfile.avatar_url || "",
          is_public: existingProfile.is_public || false,
          show_achievements: existingProfile.show_achievements ?? true,
          show_courses: existingProfile.show_courses ?? true,
        });
      }

      // Load achievements
      const { achievements: userAchievements } = await socialProfileService.getProfileAchievements(userId);
      setAchievements(userAchievements);

      // Load courses
      const { courses: userCourses } = await socialProfileService.getProfileCourses(userId);
      setCourses(userCourses);

    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error loading profile",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { profile: updatedProfile, error } = await socialProfileService.upsertProfile(
        user.id,
        formData
      );

      if (error) throw error;

      setProfile(updatedProfile);
      setEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your social profile has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="Social Profile" />
        <Navigation />
        <div className="min-h-screen bg-background pt-16">
          <div className="container mx-auto px-4 py-8">
            <ProfileSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Social Profile - Student Portal" />
      <Navigation />
      
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Breadcrumb
            items={[
              { label: "Student Portal", href: "/student/portal" },
              { label: "Social Profile" },
            ]}
          />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Social Profile</h1>
                <p className="text-muted-foreground">Share your achievements with the community</p>
              </div>
            </div>
            
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  if (profile) {
                    setFormData({
                      display_name: profile.display_name || "",
                      bio: profile.bio || "",
                      avatar_url: profile.avatar_url || "",
                      is_public: profile.is_public || false,
                      show_achievements: profile.show_achievements ?? true,
                      show_courses: profile.show_courses ?? true,
                    });
                  }
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="achievements">
                Achievements
                <Badge variant="secondary" className="ml-2">{achievements.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="courses">
                Courses
                <Badge variant="secondary" className="ml-2">{courses.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Customize how you appear to other students
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Preview */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback>
                        {formData.display_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{formData.display_name || "Your Name"}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        disabled={!editing}
                        placeholder="How should we call you?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!editing}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      <Input
                        id="avatar_url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                        disabled={!editing}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="is_public">Public Profile</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow other students to see your profile
                          </p>
                        </div>
                        <Switch
                          id="is_public"
                          checked={formData.is_public}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                          disabled={!editing}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show_achievements">Show Achievements</Label>
                          <p className="text-sm text-muted-foreground">
                            Display your badges and trophies
                          </p>
                        </div>
                        <Switch
                          id="show_achievements"
                          checked={formData.show_achievements}
                          onCheckedChange={(checked) => setFormData({ ...formData, show_achievements: checked })}
                          disabled={!editing}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show_courses">Show Courses</Label>
                          <p className="text-sm text-muted-foreground">
                            Display courses you've completed
                          </p>
                        </div>
                        <Switch
                          id="show_courses"
                          checked={formData.show_courses}
                          onCheckedChange={(checked) => setFormData({ ...formData, show_courses: checked })}
                          disabled={!editing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              {achievements.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No achievements yet. Keep learning to unlock badges!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{achievement.badge_name}</CardTitle>
                          <Award className="h-6 w-6 text-yellow-500" />
                        </div>
                        <CardDescription>
                          Earned {new Date(achievement.earned_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      {achievement.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="courses">
              {courses.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No courses completed yet</p>
                    <Link href="/courses">
                      <Button>Browse Courses</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {courses.map((course) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {course.scheduled_classes?.course_templates?.name || "Course"}
                        </CardTitle>
                        <CardDescription>
                          Enrolled {new Date(course.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {course.scheduled_classes?.course_templates?.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                          <Badge variant={course.status === "confirmed" ? "default" : "secondary"}>
                            {course.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}