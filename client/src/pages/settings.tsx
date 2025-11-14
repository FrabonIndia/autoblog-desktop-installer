import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, analyzeWebsite } from "@/lib/api";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [industry, setIndustry] = useState("");
  const [blogTone, setBlogTone] = useState("professional");
  const [publishMethod, setPublishMethod] = useState("manual");
  const [wordpressUrl, setWordpressUrl] = useState("");
  const [wordpressUsername, setWordpressUsername] = useState("");
  const [wordpressAppPassword, setWordpressAppPassword] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      if (data) {
        setWebsiteUrl(data.websiteUrl || "");
        setOpenaiApiKey(data.openaiApiKey === "***" ? "" : data.openaiApiKey);
        setIndustry(data.industry || "");
        setBlogTone(data.blogTone || "professional");
        setPublishMethod(data.publishMethod || "manual");
        setWordpressUrl(data.wordpressUrl || "");
        setWordpressUsername(data.wordpressUsername || "");
        setWordpressAppPassword(data.wordpressAppPassword === "***" ? "" : data.wordpressAppPassword);
      }
    } catch (error: any) {
      // Settings don't exist yet - that's okay
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!websiteUrl || !openaiApiKey) {
      toast({
        title: "Error",
        description: "Website URL and OpenAI API key are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveSettings({
        websiteUrl,
        openaiApiKey,
        industry,
        blogTone,
        publishMethod,
        wordpressUrl: publishMethod === "wordpress" ? wordpressUrl : undefined,
        wordpressUsername: publishMethod === "wordpress" ? wordpressUsername : undefined,
        wordpressAppPassword: publishMethod === "wordpress" ? wordpressAppPassword : undefined,
      });

      toast({
        title: "Success!",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: "Error",
        description: "Please enter a website URL first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeWebsite(websiteUrl);
      setIndustry(result.industry);
      toast({
        title: "Success!",
        description: `Detected industry: ${result.industry}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze website",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="publishing">Publishing</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Website Settings</CardTitle>
                <CardDescription>
                  Configure your website and content preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                    <Button onClick={handleAnalyzeWebsite} disabled={isAnalyzing} variant="outline">
                      {isAnalyzing ? "Analyzing..." : "Analyze"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your website URL for content analysis and publishing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                  <p className="text-xs text-muted-foreground">
                    AI will generate content specific to your industry
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blogTone">Blog Tone</Label>
                  <Select value={blogTone} onValueChange={setBlogTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OpenAI API Configuration</CardTitle>
                <CardDescription>
                  Your API key is stored locally and never sent to us
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                  <Input
                    id="openaiApiKey"
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </TabsContent>

          <TabsContent value="publishing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Method</CardTitle>
                <CardDescription>
                  Choose how you want to publish your blog posts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Publish Method</Label>
                  <Select value={publishMethod} onValueChange={setPublishMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Export</SelectItem>
                      <SelectItem value="wordpress">WordPress Auto-Publish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {publishMethod === "wordpress" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="wordpressUrl">WordPress Site URL</Label>
                      <Input
                        id="wordpressUrl"
                        type="url"
                        value={wordpressUrl}
                        onChange={(e) => setWordpressUrl(e.target.value)}
                        placeholder="https://yoursite.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wordpressUsername">WordPress Username</Label>
                      <Input
                        id="wordpressUsername"
                        value={wordpressUsername}
                        onChange={(e) => setWordpressUsername(e.target.value)}
                        placeholder="admin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wordpressAppPassword">WordPress Application Password</Label>
                      <Input
                        id="wordpressAppPassword"
                        type="password"
                        value={wordpressAppPassword}
                        onChange={(e) => setWordpressAppPassword(e.target.value)}
                        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      />
                      <p className="text-xs text-muted-foreground">
                        Create an application password in WordPress under Users → Profile → Application Passwords
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? "Saving..." : "Save Publishing Settings"}
            </Button>
          </TabsContent>

          <TabsContent value="widget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Embeddable Widget</CardTitle>
                <CardDescription>
                  Add a blog feed widget to your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Widget Code</Label>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`<div id="autoblog-widget"></div>
<script>
  fetch('http://localhost:3001/api/widget/posts?limit=5')
    .then(r => r.json())
    .then(posts => {
      const widget = document.getElementById('autoblog-widget');
      widget.innerHTML = posts.map(post => \`
        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">\${post.title}</h3>
          <p style="margin: 0; color: #6b7280;">\${post.excerpt}</p>
        </div>
      \`).join('');
    });
</script>`}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    Copy this code and paste it into your website where you want the blog feed to appear
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
