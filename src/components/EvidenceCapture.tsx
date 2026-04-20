import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, Loader2, MapPin } from "lucide-react";

type EvidenceCaptureProps = {
  bookingId?: string;
  scheduledClassId?: string;
  onCaptureComplete?: () => void;
};

export function EvidenceCapture({ bookingId, scheduledClassId, onCaptureComplete }: EvidenceCaptureProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [evidenceType, setEvidenceType] = useState<string>("attendance_photo");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Location captured",
            description: "GPS coordinates added to evidence"
          });
        },
        (error) => {
          console.error("Location error:", error);
        }
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Auto-capture location on mobile
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        getLocation();
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a photo or document",
        variant: "destructive"
      });
      return;
    }

    if (!bookingId && !scheduledClassId) {
      toast({
        title: "Missing reference",
        description: "Evidence must be linked to a booking or class",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const timestamp = new Date().getTime();
      const sanitizedFilename = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `evidence/${timestamp}_${sanitizedFilename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from("evidence_capture")
        .insert({
          booking_id: bookingId || null,
          scheduled_class_id: scheduledClassId || null,
          evidence_type: evidenceType,
          file_path: uploadData.path,
          file_name: selectedFile.name,
          mime_type: selectedFile.type,
          description: description || null,
          captured_by: user.id,
          geolocation: location ? {
            lat: location.lat,
            lng: location.lng,
            accuracy: 10
          } : null,
          synced_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      toast({
        title: "Evidence uploaded",
        description: "Evidence has been captured successfully"
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl("");
      setDescription("");
      setLocation(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";

      onCaptureComplete?.();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Capture Evidence
        </CardTitle>
        <CardDescription>
          Take photos or upload documents for compliance records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Evidence Type</Label>
          <Select value={evidenceType} onValueChange={setEvidenceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attendance_photo">Attendance Photo</SelectItem>
              <SelectItem value="practical_assessment">Practical Assessment</SelectItem>
              <SelectItem value="completed_work">Completed Work</SelectItem>
              <SelectItem value="document">Document/Form</SelectItem>
              <SelectItem value="safety_compliance">Safety Compliance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="Add context about this evidence..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="border rounded-lg overflow-hidden">
            <Image 
              src={previewUrl} 
              alt="Evidence preview" 
              width={800}
              height={400}
              className="w-full h-64 object-cover"
              priority
            />
          </div>
        )}

        {/* Capture Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
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
              onChange={handleFileSelect}
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

        {/* Location */}
        <Button
          variant="ghost"
          size="sm"
          onClick={getLocation}
          className="w-full"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {location ? "Location Captured" : "Add GPS Location"}
        </Button>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Upload Evidence
        </Button>
      </CardContent>
    </Card>
  );
}