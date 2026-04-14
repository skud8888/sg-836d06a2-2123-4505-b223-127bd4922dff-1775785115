import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { certificateService } from "@/services/certificateService";
import { supabase } from "@/integrations/supabase/client";
import { Award, Download, Loader2, Eye } from "lucide-react";

type CertificateGeneratorProps = {
  studentId: string;
  courseTemplateId: string;
  studentName: string;
  courseName: string;
  onCertificateGenerated?: (certificateId: string) => void;
};

export function CertificateGenerator({
  studentId,
  courseTemplateId,
  studentName,
  courseName,
  onCertificateGenerated
}: CertificateGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [certificate, setCertificate] = useState<any>(null);
  const [certificateHTML, setCertificateHTML] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .order("is_default", { ascending: false });

    if (!error && data) {
      setTemplates(data);
      const defaultTemplate = data.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await certificateService.createCertificate(
        studentId,
        courseTemplateId
      );

      setCertificate(result.certificate);
      setCertificateHTML(result.html);

      toast({
        title: "Certificate generated",
        description: `Certificate #${result.certificate.certificate_number} created successfully`
      });

      onCertificateGenerated?.(result.certificate.id);
      setShowPreview(true);

    } catch (error: any) {
      console.error("Certificate generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!certificateHTML) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(certificateHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-print after a brief delay to ensure content loads
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Generate Certificate
        </CardTitle>
        <CardDescription>
          Create a completion certificate for {studentName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!certificate ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Certificate Template
              </label>
              <Select 
                value={selectedTemplate} 
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} 
                      {template.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Student:</span> {studentName}
              </div>
              <div className="text-sm">
                <span className="font-medium">Course:</span> {courseName}
              </div>
              <div className="text-sm text-muted-foreground">
                Certificate will be issued with a unique verification number
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplate || generating}
              className="w-full"
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Certificate
            </Button>
          </>
        ) : (
          <>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-900 font-medium">
                <Award className="h-5 w-5" />
                Certificate Generated Successfully
              </div>
              <div className="text-sm text-green-800">
                Certificate Number: <span className="font-mono font-semibold">
                  {certificate.certificate_number}
                </span>
              </div>
              <div className="text-sm text-green-800">
                Verification Code: <span className="font-mono">
                  {certificate.verification_code}
                </span>
              </div>
            </div>

            {showPreview && (
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="bg-white p-4 max-h-96 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: certificateHTML }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setCertificate(null);
                setCertificateHTML("");
                setShowPreview(false);
              }}
              className="w-full"
            >
              Generate Another Certificate
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}