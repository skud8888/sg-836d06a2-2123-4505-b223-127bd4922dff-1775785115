import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { SignatureCapture } from "@/components/SignatureCapture";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { signatureService } from "@/services/signatureService";
import { contractService } from "@/services/contractService";
import { FileSignature, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type SignatureRequest = Tables<"signature_requests">;

export default function SignPage() {
  const router = useRouter();
  const { requestId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [contractContent, setContractContent] = useState("");
  const [step, setStep] = useState<"review" | "sign" | "complete">("review");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);

  useEffect(() => {
    if (requestId && typeof requestId === "string") {
      loadRequest(requestId);
    }
  }, [requestId]);

  async function loadRequest(id: string) {
    setLoading(true);
    try {
      const data = await signatureService.getSignatureRequest(id);
      if (!data) {
        toast({
          title: "Not Found",
          description: "Signature request not found",
          variant: "destructive",
        });
        return;
      }

      setRequest(data);

      // Check if already signed
      if (data.status === "signed") {
        setStep("complete");
        return;
      }

      // Check if expired
      if (new Date(data.expires_at!) < new Date()) {
        toast({
          title: "Expired",
          description: "This signature request has expired",
          variant: "destructive",
        });
        return;
      }

      // Load contract content
      if (data.contract_template_id) {
        const { content } = await contractService.generateContract(
          data.contract_template_id,
          data.booking_id
        );
        if (content) {
          setContractContent(content);
        }
      } else if (data.metadata && (data.metadata as any).generated_content) {
        setContractContent((data.metadata as any).generated_content);
      }

      // Mark as viewed
      await signatureService.markAsViewed(id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignatureComplete(signatureData: string) {
    if (!request || !termsAccepted || !identityConfirmed) {
      toast({
        title: "Verification Required",
        description: "Please accept all confirmations before signing",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { documentId, error } = await signatureService.completeSignature(
        request.id,
        signatureData
      );

      if (error) throw error;

      toast({
        title: "Signature Complete",
        description: "Your signature has been recorded successfully",
      });

      setStep("complete");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4" />
          <p className="text-slate-600">Loading signature request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Request Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              The signature request you're looking for could not be found or has been removed.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(request.expires_at!) < new Date();

  if (isExpired && request.status !== "signed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              Request Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              This signature request expired on {format(new Date(request.expires_at!), "PPP")}.
              Please contact the sender to request a new signature link.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`Sign Document - ${request.document_type.replace(/_/g, " ")}`}
        description="Review and sign your document"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {step === "complete" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Signature Complete
                </CardTitle>
                <CardDescription>
                  Your document has been signed successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Thank You, {request.recipient_name}!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Your signature has been recorded and verified.
                  </p>
                  <div className="text-sm text-green-600 space-y-1">
                    <p>Document: {request.document_type.replace(/_/g, " ")}</p>
                    <p>Signed: {format(new Date(request.signed_at!), "PPP 'at' p")}</p>
                    <p>You will receive a copy of the signed document via email.</p>
                  </div>
                </div>
                <Button onClick={() => router.push("/")} className="w-full">
                  Return Home
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Document Header */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5" />
                    {request.document_type.replace(/_/g, " ").toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    Please review the document carefully before signing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-600">Recipient:</p>
                      <p className="font-medium">{request.recipient_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600">Expires:</p>
                      <p className="font-medium">{format(new Date(request.expires_at!), "PPP")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {step === "review" && (
                <>
                  {/* Document Content */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Document Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-8 border rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">
                          {contractContent || "Loading document content..."}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Legal Confirmations */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Legal Confirmations</CardTitle>
                      <CardDescription>
                        Please confirm the following before proceeding
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        />
                        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                          I have read and understood the complete document above, and I agree to its terms and conditions.
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="identity"
                          checked={identityConfirmed}
                          onCheckedChange={(checked) => setIdentityConfirmed(checked as boolean)}
                        />
                        <Label htmlFor="identity" className="text-sm leading-relaxed cursor-pointer">
                          I confirm that I am {request.recipient_name} and I am legally authorized to sign this document on my own behalf.
                        </Label>
                      </div>
                      <Alert>
                        <AlertDescription className="text-xs">
                          By proceeding to sign, your signature, IP address, and timestamp will be recorded and legally binding. This creates an audit trail for verification purposes.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => setStep("sign")}
                    disabled={!termsAccepted || !identityConfirmed}
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Sign Document
                  </Button>
                </>
              )}

              {step === "sign" && (
                <>
                  <SignatureCapture
                    recipientName={request.recipient_name}
                    onComplete={handleSignatureComplete}
                    onCancel={() => setStep("review")}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}