import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2 } from "lucide-react";

type StripeCheckoutProps = {
  bookingId: string;
  totalAmount: number;
  studentName: string;
  courseName: string;
};

export function StripeCheckout({
  bookingId,
  totalAmount,
  studentName,
  courseName,
}: StripeCheckoutProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [customAmount, setCustomAmount] = useState<string>("");

  const depositAmount = totalAmount * 0.3; // 30% deposit
  const paymentAmount =
    paymentType === "full"
      ? totalAmount
      : paymentType === "deposit"
      ? depositAmount
      : parseFloat(customAmount) || 0;

  const handleCheckout = async () => {
    if (paymentAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: paymentAmount,
          metadata: {
            studentName,
            courseName,
            paymentType,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
        <CardDescription>
          Pay securely with Stripe - {courseName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Student</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Course Total</span>
            <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="flex-1 cursor-pointer">
                <div className="font-medium">Pay in Full</div>
                <div className="text-sm text-muted-foreground">
                  ${totalAmount.toFixed(2)} - Complete payment
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <RadioGroupItem value="deposit" id="deposit" />
              <Label htmlFor="deposit" className="flex-1 cursor-pointer">
                <div className="font-medium">Pay Deposit (30%)</div>
                <div className="text-sm text-muted-foreground">
                  ${depositAmount.toFixed(2)} - Remaining ${(totalAmount - depositAmount).toFixed(2)}
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted transition-colors">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="flex-1 cursor-pointer">
                <div className="font-medium">Custom Amount</div>
                <div className="text-sm text-muted-foreground">
                  Enter your own payment amount
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {paymentType === "custom" && (
          <div>
            <Label htmlFor="customAmount">Payment Amount</Label>
            <Input
              id="customAmount"
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="1"
              max={totalAmount}
              step="0.01"
            />
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Amount to Pay</span>
            <span className="text-2xl font-bold text-primary">
              ${paymentAmount.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Continue to Payment
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Secure payment powered by Stripe. Your card details are never stored on our servers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}