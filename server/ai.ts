import OpenAI from "openai";
import { storage } from "./storage";

export async function analyzeWebsite(url: string, openaiApiKey: string): Promise<{ industry: string; description: string }> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  
  try {
    // In production, this would fetch and analyze the actual website
    // For now, we'll use AI to infer from the URL
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a website analyzer. Based on the website URL, determine the industry and provide a brief description. Respond in JSON format with 'industry' and 'description' fields."
        },
        {
          role: "user",
          content: `Analyze this website URL and determine its industry: ${url}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      industry: result.industry || "General",
      description: result.description || "Website analysis"
    };
  } catch (error: any) {
    console.error("Website analysis error:", error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  }
}

export async function generateBlogPost(
  topic: string,
  industry: string,
  tone: string,
  openaiApiKey: string
): Promise<{ title: string; content: string; excerpt: string; keywords: string[] }> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert blog writer for the ${industry} industry. Write engaging, SEO-optimized blog posts in a ${tone} tone. Respond in JSON format with 'title', 'content' (in HTML format), 'excerpt', and 'keywords' (array of 5-10 keywords) fields.`
        },
        {
          role: "user",
          content: `Write a comprehensive blog post about: ${topic}\n\nMake it informative, engaging, and optimized for SEO. Include proper HTML formatting with headings, paragraphs, and lists where appropriate. The content should be 800-1200 words.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const tokensUsed = response.usage?.total_tokens || 0;
    const estimatedCost = (tokensUsed / 1000) * 0.002; // Rough estimate

    // Log generation history
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    await storage.createGenerationHistory({
      topic,
      prompt: `Topic: ${topic}, Industry: ${industry}, Tone: ${tone}`,
      response: response.choices[0].message.content || "",
      tokensUsed,
      cost: estimatedCost.toFixed(4),
      status: "success",
    });

    return {
      title: result.title || `Blog Post: ${topic}`,
      content: result.content || "",
      excerpt: result.excerpt || "",
      keywords: result.keywords || []
    };
  } catch (error: any) {
    console.error("Blog generation error:", error);
    
    await storage.createGenerationHistory({
      topic,
      prompt: `Topic: ${topic}, Industry: ${industry}, Tone: ${tone}`,
      status: "error",
      errorMessage: error.message,
    });
    
    throw new Error(`Failed to generate blog post: ${error.message}`);
  }
}

export async function publishToWordPress(
  post: { title: string; content: string; excerpt: string },
  wordpressUrl: string,
  username: string,
  appPassword: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    
    const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: 'publish',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${error}`);
    }

    const data = await response.json();
    return {
      success: true,
      postUrl: data.link,
    };
  } catch (error: any) {
    console.error("WordPress publishing error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
