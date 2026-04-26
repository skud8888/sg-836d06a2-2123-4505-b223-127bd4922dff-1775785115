import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function SetupAdminPage() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("Admin123!");
  const [fullName, setFullName] = useState("Admin User");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/setup-initial-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Admin user created successfully!"
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create admin user"
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Network error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Create or reset the admin user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Create Admin User"
              )}
            </Button>
          </form>

          {result && (
            <Alert className={`mt-4 ${result.success ? "border-green-500" : "border-red-500"}`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <AlertDescription className="flex-1">
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {result?.success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">✅ Setup Complete!</p>
              <p className="text-sm text-green-700 mb-3">You can now login with:</p>
              <div className="bg-white p-3 rounded border border-green-200 text-sm space-y-1 mb-3">
                <div><strong>Email:</strong> {email}</div>
                <div><strong>Password:</strong> {password}</div>
              </div>
              <Link href="/admin/login">
                <Button className="w-full" variant="default">
                  Go to Login Page
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Already have an account?</p>
            <Link href="/admin/login" className="text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}