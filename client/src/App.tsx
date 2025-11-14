import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import LicenseActivation from "@/pages/license-activation";

export default function App() {
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check license status
    fetch("/api/license/status")
      .then((res) => res.json())
      .then((data) => {
        setHasLicense(data.hasLicense && data.isActive);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to check license status:", error);
        setIsLoading(false);
      });
  }, []);

  const handleLicenseActivated = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AutoBlog Pro...</p>
        </div>
      </div>
    );
  }

  // Show license activation if no valid license
  if (hasLicense === false) {
    return (
      <>
        <LicenseActivation onActivationComplete={handleLicenseActivated} />
        <Toaster />
      </>
    );
  }

  // License activated - show dashboard
  return (
    <>
      <Switch>
        <Route path="/settings" component={SettingsPage} />
        <Route path="/" component={DashboardPage} />
      </Switch>
      <Toaster />
    </>
  );
}
