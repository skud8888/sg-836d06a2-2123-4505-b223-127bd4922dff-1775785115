import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Pen, RotateCcw, Check, Type, Upload } from "lucide-react";

type SignatureCaptureProps = {
  onComplete: (signatureData: string) => void;
  onCancel?: () => void;
  recipientName: string;
};

export function SignatureCapture({
  onComplete,
  onCancel,
  recipientName,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing styles
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTypedName("");
    setUploadedImage(null);
  };

  const generateTypedSignature = () => {
    if (!typedName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "48px 'Dancing Script', cursive";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 4, canvas.height / 4);

    setHasSignature(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setUploadedImage(imageData);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(
          (canvas.width / 2) / img.width,
          (canvas.height / 2) / img.height
        );
        const x = (canvas.width / 2 - img.width * scale) / 2;
        const y = (canvas.height / 2 - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setHasSignature(true);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast({
        title: "No signature",
        description: "Please sign before submitting",
        variant: "destructive",
      });
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    onComplete(signatureData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="h-5 w-5" />
          Sign Document
        </CardTitle>
        <CardDescription>
          Please sign below to complete the agreement, {recipientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={signatureMethod} onValueChange={(v: any) => {
          setSignatureMethod(v);
          clearSignature();
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">
              <Pen className="h-4 w-4 mr-2" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type">
              <Type className="h-4 w-4 mr-2" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/30">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-48 bg-white rounded cursor-crosshair touch-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div>
              <Label htmlFor="typedName">Type Your Full Name</Label>
              <Input
                id="typedName"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <Button onClick={generateTypedSignature} variant="outline" className="w-full">
              Generate Signature
            </Button>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/30">
              <canvas
                ref={canvasRef}
                className="w-full h-48 bg-white rounded"
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="signatureFile">Upload Signature Image</Label>
              <Input
                id="signatureFile"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a clear image of your signature (PNG, JPG, or other image formats)
              </p>
            </div>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/30">
              <canvas
                ref={canvasRef}
                className="w-full h-48 bg-white rounded"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={clearSignature}
            disabled={!hasSignature}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>

          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={saveSignature} disabled={!hasSignature}>
              <Check className="h-4 w-4 mr-2" />
              Submit Signature
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By signing, you agree to the terms and conditions outlined in this document.
          Your IP address and timestamp will be recorded for verification purposes.
        </p>
      </CardContent>
    </Card>
  );
}