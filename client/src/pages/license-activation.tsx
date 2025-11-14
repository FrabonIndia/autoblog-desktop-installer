import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

interface LicenseActivationProps {
  onActivationComplete: () => void;
}

export default function LicenseActivation({ onActivationComplete }: LicenseActivationProps) {
  const [email, setEmail] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivating(true);

    try {
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          licenseKey: licenseKey.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "License Activated!",
          description: "Your license has been successfully activated.",
        });
        
        // Wait a moment for toast to show, then complete
        setTimeout(() => {
          onActivationComplete();
        }, 1000);
      } else {
        throw new Error(data.message || "Failed to activate license");
      }
    } catch (error: any) {
      console.error("License activation error:", error);
      toast({
        title: "Activation Failed",
        description: error.message || "Could not activate license. Please check your email and license key.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Activate AutoBlog Pro</CardTitle>
          <CardDescription>
            Enter your email and license key to activate (one-time internet connection required)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-license-email"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                The email used during purchase
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-key">License Key</Label>
              <Input
                id="license-key"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                required
                maxLength={19}
                data-testid="input-license-key"
              />
              <p className="text-xs text-muted-foreground">
                Found in your purchase confirmation email
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold">✅ After Activation:</p>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• Runs 100% on YOUR computer</li>
                <li>• Uses YOUR OpenAI API key</li>
                <li>• Works offline (after activation)</li>
                <li>• No subscription, lifetime access</li>
              </ul>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isActivating || !email || !licenseKey}
              data-testid="button-activate-license"
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activate License
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Need help? Contact support with your order details
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
