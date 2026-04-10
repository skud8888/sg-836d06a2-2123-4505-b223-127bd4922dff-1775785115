import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { SignatureCapture } from "@/components/SignatureCapture";
import { signatureService } from "@/services/signatureService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type SignatureRequest = Tables<"signature_requests">;

export default function SignDocumentPage() {
  const router = useRouter();
  const { requestId } = router.query;
  const { toast } = useToast();
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const fetchRequest = async () => {
    setLoading(true);
    const data = await signatureService.getSignatureRequest(requestId as string);
    setRequest(data);
    setLoading(false);
  };

  const handleSignatureComplete = async (signatureData: string) => {
    setSubmitting(true);

    const { documentId, error } = await signatureService.completeSignature(
      requestId as string,
      signatureData
    );

    if (error) {
      toast({
        title: "Signature failed",
        description: error.message,
        variant: "destructive",
      });
      setSubmitting(false);
    } else {
      toast({
        title: "Signature completed",
        description: "Thank you! Your signature has been recorded.",
      });

      // Refresh to show completion state
      await fetchRequest();
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Signature request not found</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const isExpired = new Date(request.expires_at!) < new Date();
  const isSigned = request.status === "signed";

  return (
    <>
      <SEO
        title="Sign Document - GTS Training"
        description="Review and sign your enrollment document"
      />
      <Navigation />
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8">Document Signature</h1>

          {isSigned ? (
            <Card className="border-2 border-green-500">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Document Signed</CardTitle>
                <CardDescription>
                  This document was signed on{" "}
                  {format(new Date(request.signed_at!), "PPP 'at' p")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signer</span>
                    <span className="font-medium">{request.recipient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Document Type</span>
                    <span className="font-medium">
                      {request.document_type.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP Address</span>
                    <span className="font-medium">{request.signer_ip}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isExpired ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This signature request has expired. Please contact us for a new request.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {request.document_type.replace(/_/g, " ").toUpperCase()}
                    </CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {format(new Date(request.expires_at!), "MMM d")}
                    </Badge>
                  </div>
                  <CardDescription>
                    Please review the document and sign below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-muted rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Document Preview Area - In production, display the actual contract PDF here
                    </p>
                    <div className="h-96 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                      <p className="text-muted-foreground">PDF Preview</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SignatureCapture
                recipientName={request.recipient_name}
                onComplete={handleSignatureComplete}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}