import type { Express } from "express";
import { storage } from "./storage";
import { isFirstTimeSetup, createUser, authenticateUser } from "./auth";
import { analyzeWebsite, generateBlogPost, publishToWordPress } from "./ai";
import { requireAuth, createSession, destroySession } from "./middleware";
import { generateDeviceFingerprint, getMachineLabel } from "./device-fingerprint";
import { z } from "zod";

const setupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const settingsSchema = z.object({
  websiteUrl: z.string().url(),
  openaiApiKey: z.string().min(10),
  industry: z.string().optional(),
  blogTone: z.string().optional(),
  publishMethod: z.string().optional(),
  wordpressUrl: z.string().optional(),
  wordpressUsername: z.string().optional(),
  wordpressAppPassword: z.string().optional(),
});

const generatePostSchema = z.object({
  topic: z.string().min(1),
});

const createPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  status: z.string().default("draft"),
  scheduledFor: z.string().optional(),
  topic: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.string().optional(),
  scheduledFor: z.string().optional(),
  topic: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const licenseActivationSchema = z.object({
  email: z.string().email(),
  licenseKey: z.string().min(1),
});

export function registerRoutes(app: Express) {
  // Check license status
  app.get("/api/license/status", async (req, res) => {
    try {
      const license = await storage.getLicense();
      res.json({ 
        hasLicense: !!license,
        isActive: license?.status === "active"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activate license
  app.post("/api/license/activate", async (req, res) => {
    try {
      const { email, licenseKey } = licenseActivationSchema.parse(req.body);
      
      // Generate device fingerprint
      const deviceFingerprint = generateDeviceFingerprint();
      const machineLabel = getMachineLabel();
      
      // Get the sales platform API URL (default to production)
      const apiUrl = process.env.SALES_PLATFORM_URL || "https://autoblogpro.replit.app";
      
      // Call the sales platform license validation API
      const response = await fetch(`${apiUrl}/api/licenses/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          licenseKey,
          deviceFingerprint,
          machineLabel,
          clientVersion: "1.0.0",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        return res.status(400).json({
          success: false,
          message: data.message || "License validation failed",
        });
      }

      // Store license locally
      await storage.createLicense({
        email,
        licenseKey,
        deviceFingerprint,
        status: "active",
      });

      res.json({
        success: true,
        message: "License activated successfully",
      });
    } catch (error: any) {
      console.error("License activation error:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to activate license",
      });
    }
  });

  // Check if first-time setup is needed
  app.get("/api/setup/status", async (req, res) => {
    try {
      const needsSetup = await isFirstTimeSetup();
      res.json({ needsSetup });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initial setup
  app.post("/api/setup", async (req, res) => {
    try {
      const { username, password } = setupSchema.parse(req.body);
      
      const needsSetup = await isFirstTimeSetup();
      if (!needsSetup) {
        return res.status(400).json({ error: "Setup already completed" });
      }

      const user = await createUser(username, password);
      res.json({ success: true, userId: user.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = createSession(user.id, user.username);
      res.json({ success: true, userId: user.id, username: user.username, token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  // Logout
  app.post("/api/logout", requireAuth, async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      destroySession(token);
    }
    res.json({ success: true });
  });

  // Get settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.json(null);
      }
      
      // Don't send the API key to the client, just indicate if it's set
      res.json({
        ...settings,
        openaiApiKey: settings.openaiApiKey ? "***" : "",
        wordpressAppPassword: settings.wordpressAppPassword ? "***" : "",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save settings
  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const data = settingsSchema.parse(req.body);
      
      const existingSettings = await storage.getSettings();
      
      let result;
      if (existingSettings) {
        result = await storage.updateSettings(existingSettings.id, data);
      } else {
        result = await storage.createSettings(data);
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analyze website
  app.post("/api/analyze-website", requireAuth, async (req, res) => {
    try {
      const { url } = req.body;
      const settings = await storage.getSettings();
      
      if (!settings || !settings.openaiApiKey) {
        return res.status(400).json({ error: "OpenAI API key not configured" });
      }

      const analysis = await analyzeWebsite(url, settings.openaiApiKey);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate blog post
  app.post("/api/generate-post", requireAuth, async (req, res) => {
    try {
      const { topic } = generatePostSchema.parse(req.body);
      const settings = await storage.getSettings();
      
      if (!settings || !settings.openaiApiKey) {
        return res.status(400).json({ error: "OpenAI API key not configured" });
      }

      const post = await generateBlogPost(
        topic,
        settings.industry || "General",
        settings.blogTone || "professional",
        settings.openaiApiKey
      );
      
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all blog posts
  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single blog post
  app.get("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create blog post
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const data = createPostSchema.parse(req.body);
      
      const post = await storage.createBlogPost({
        ...data,
        keywords: data.keywords ? JSON.stringify(data.keywords) : undefined,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      });
      
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update blog post
  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = updatePostSchema.parse(req.body);
      
      const post = await storage.updateBlogPost(id, {
        ...data,
        keywords: data.keywords ? JSON.stringify(data.keywords) : undefined,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      });
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete blog post
  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Publish post to WordPress
  app.post("/api/posts/:id/publish", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const settings = await storage.getSettings();
      if (!settings || settings.publishMethod !== 'wordpress' || !settings.wordpressUrl) {
        return res.status(400).json({ error: "WordPress not configured" });
      }

      const result = await publishToWordPress(
        { title: post.title, content: post.content, excerpt: post.excerpt || "" },
        settings.wordpressUrl,
        settings.wordpressUsername || "",
        settings.wordpressAppPassword || ""
      );

      if (result.success) {
        await storage.updateBlogPost(id, {
          status: "published",
          publishedAt: new Date(),
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get generation history
  app.get("/api/generation-history", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getGenerationHistory(limit);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Widget endpoint - public endpoint to get published posts
  app.get("/api/widget/posts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const posts = await storage.getBlogPostsByStatus("published");
      
      const limitedPosts = posts.slice(0, limit).map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
      }));
      
      res.json(limitedPosts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
