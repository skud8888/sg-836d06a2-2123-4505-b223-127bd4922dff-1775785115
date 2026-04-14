import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SignatureCapture } from "@/components/SignatureCapture";
import { Camera, Upload, Loader2, CheckCircle2, User } from "lucide-react";

type IDVerificationUploadProps = {
  bookingId: string;
  studentName: string;
  onVerificationComplete?: (documentId: string) => void;
};

export function IDVerificationUpload({ 
  bookingId, 
  studentName,
  onVerificationComplete 
}: IDVerificationUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string>("");
  const [idType, setIdType] = useState<string>("drivers_license");
  const [idNumber, setIdNumber] = useState("");
  const [trainerSignature, setTrainerSignature] = useState<string>("");
  const [verificationComplete, setVerificationComplete] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "ID photo must be under 5MB",
          variant: "destructive"
        });
        return;
      }
      setIdPhoto(file);
      setIdPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureComplete = (signature: string) => {
    setTrainerSignature(signature);
  };

  const handleSubmit = async () => {
    if (!idPhoto) {
      toast({
        title: "Missing ID photo",
        description: "Please capture or upload an ID photo",
        variant: "destructive"
      });
      return;
    }

    if (!trainerSignature) {
      toast({
        title: "Missing signature",
        description: "Please sign to verify the ID check",
        variant: "destructive"
      });
      return;
    }

    if (!idNumber.trim()) {
      toast({
        title: "Missing ID number",
        description: "Please enter the ID number for verification",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload ID photo to storage
      const timestamp = Date.now();
      const sanitizedFilename = idPhoto.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const photoPath = `${bookingId}/${timestamp}_${sanitizedFilename}`;

      const { error: uploadError } = await supabase.storage
        .from("ids")
        .upload(photoPath, idPhoto);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          booking_id: bookingId,
          document_type: "student_id",
          file_name: idPhoto.name,
          file_path: photoPath,
          file_size: idPhoto.size,
          mime_type: idPhoto.type,
          uploaded_by: user.id,
          notes: `${idType}: ${idNumber}`,
          tags: ["id-verification", idType]
        })
        .select()
        .single();

      if (docError) throw docError;

      // Store signature separately (could be in metadata or separate storage)
      const signatureBlob = await fetch(trainerSignature).then(r => r.blob());
      const signaturePath = `${bookingId}/signature_${timestamp}.png`;
      
      await supabase.storage
        .from("ids")
        .upload(signaturePath, signatureBlob);

      // Update document with signature reference
      await supabase
        .from("documents")
        .update({
          notes: `${idType}: ${idNumber}\nVerified by: ${user.email}\nSignature: ${signaturePath}`
        })
        .eq("id", document.id);

      toast({
        title: "ID verification complete",
        description: "Student ID has been verified and recorded"
      });

      setVerificationComplete(true);
      onVerificationComplete?.(document.id);

    } catch (error: any) {
      console.error("ID verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (verificationComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            ID Verification Complete
          </h3>
          <p className="text-green-700">
            Student ID has been verified and recorded for {studentName}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          ID Verification for {studentName}
        </CardTitle>
        <CardDescription>
          Capture student ID photo and verify identity before class starts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>ID Type</Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="proof_of_age">Proof of Age Card</SelectItem>
              <SelectItem value="photo_id">Photo ID Card</SelectItem>
              <SelectItem value="student_id">Student ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>ID Number</Label>
          <Input
            placeholder="Enter ID number for verification"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
          />
        </div>

        {/* Photo Preview */}
        {idPhotoPreview && (
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={idPhotoPreview} 
              alt="ID Preview" 
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Capture Buttons */}
        {!idPhoto && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
        )}

        {idPhoto && (
          <Button
            variant="outline"
            onClick={() => {
              setIdPhoto(null);
              setIdPhotoPreview("");
            }}
            className="w-full"
          >
            Retake Photo
          </Button>
        )}

        {/* Signature Capture */}
        <div className="border-t pt-4">
          <Label className="mb-2 block">Trainer Signature (Required)</Label>
          <SignatureCapture
            onSignatureComplete={handleSignatureComplete}
            label="Sign here to verify you checked this ID"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!idPhoto || !trainerSignature || !idNumber || uploading}
          className="w-full"
        >
          {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Complete ID Verification
        </Button>
      </CardContent>
    </Card>
  );
}