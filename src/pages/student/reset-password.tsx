import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function StudentResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/student/update-password`
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Reset Password - The Training Hub"
        description="Reset your student account password"
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {emailSent ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Mail className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {emailSent ? "Check Your Email" : "Reset Password"}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? "We've sent you a password reset link"
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-100 mb-2">
                    <strong>Email sent to:</strong> {email}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Click the link in your email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check your spam folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEmailSent(false)}
                    className="w-full"
                  >
                    Try Different Email
                  </Button>

                  <Link href="/">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the email address associated with your student account
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <Link href="/">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}