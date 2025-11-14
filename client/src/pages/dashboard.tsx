import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getPosts, generatePost, createPost, updatePost, deletePost } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generateTopic, setGenerateTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateTopic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const post = await generatePost(generateTopic);
      setGeneratedPost(post);
      toast({
        title: "Success!",
        description: "Blog post generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate post",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedPost) return;

    try {
      await createPost({
        title: generatedPost.title,
        content: generatedPost.content,
        excerpt: generatedPost.excerpt,
        topic: generateTopic,
        keywords: generatedPost.keywords,
        status: "draft",
      });

      toast({
        title: "Success!",
        description: "Post saved to drafts",
      });

      setGeneratedPost(null);
      setGenerateTopic("");
      setIsDialogOpen(false);
      loadPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(id);
      toast({
        title: "Success!",
        description: "Post deleted",
      });
      loadPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    const { logout } = await import("@/lib/api");
    await logout();
    window.location.href = "/login";
  };

  const draftPosts = posts.filter((p) => p.status === "draft");
  const scheduledPosts = posts.filter((p) => p.status === "scheduled");
  const publishedPosts = posts.filter((p) => p.status === "published");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AutoBlog Pro</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation("/settings")}>
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Blog Post</CardTitle>
              <CardDescription>
                Enter a topic and let AI create a professional blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter topic (e.g., 'Benefits of Cloud Computing')"
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                />
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleGenerate} disabled={isGenerating || !generateTopic.trim()}>
                      {isGenerating ? "Generating..." : "Generate Post"}
                    </Button>
                  </DialogTrigger>
                  {generatedPost && (
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{generatedPost.title}</DialogTitle>
                        <DialogDescription>Review and save your generated post</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Excerpt</h4>
                          <p className="text-sm text-muted-foreground">{generatedPost.excerpt}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Content</h4>
                          <div className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/50" dangerouslySetInnerHTML={{ __html: generatedPost.content }} />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveGenerated}>Save to Drafts</Button>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({draftPosts.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledPosts.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading posts...
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No posts yet. Generate your first blog post above!
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>
                          {post.status} • {formatDateTime(post.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDeletePost(post.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {post.excerpt && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            {draftPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No draft posts
                </CardContent>
              </Card>
            ) : (
              draftPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>{formatDateTime(post.createdAt)}</CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No scheduled posts
                </CardContent>
              </Card>
            ) : (
              scheduledPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                      Scheduled for {formatDateTime(post.scheduledFor)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            {publishedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No published posts
                </CardContent>
              </Card>
            ) : (
              publishedPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                      Published on {formatDateTime(post.publishedAt)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
