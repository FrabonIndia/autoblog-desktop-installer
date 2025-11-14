import { type User, type InsertUser, type Settings, type InsertSettings, type BlogPost, type InsertBlogPost, type GenerationHistory, type InsertGenerationHistory, type License, type InsertLicense, users, settings, blogPosts, generationHistory, license } from "@shared/schema";
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import path from "path";
import fs from "fs";

// TypeScript doesn't know about __dirname in ESM, but esbuild with format:'cjs' injects it
declare const __dirname: string;

// Get the appropriate database path
function getDatabasePath() {
  // PRIORITY 1: Use USER_DATA_PATH from environment (passed from Electron main process)
  if (process.env.USER_DATA_PATH) {
    console.log('Using user data path from environment:', process.env.USER_DATA_PATH);
    return path.join(process.env.USER_DATA_PATH, "database.sqlite");
  }
  
  // PRIORITY 2: Check if running in Electron main process
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      // Try to import electron dynamically (only works in main process)
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      console.log('Using Electron app.getPath("userData"):', userDataPath);
      return path.join(userDataPath, "database.sqlite");
    } catch (err) {
      // Electron not available (running as spawned Node process)
      console.log('Electron app not available in spawned process');
    }
  }
  
  // FALLBACK: Development mode - use local directory
  console.log('Using development fallback path');
  return path.join(__dirname, "..", "database.sqlite");
}

const dbPath = getDatabasePath();
console.log("Database path:", dbPath);

// Initialize sql.js database
let sqliteDb: SqlJsDatabase;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  const SQL = await initSqlJs();
  
  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log('Creating database directory:', dbDir);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Try to load existing database file
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(buffer);
  } else {
    sqliteDb = new SQL.Database();
  }
  
  db = drizzle(sqliteDb);
  
  // Initialize database tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website_url TEXT NOT NULL,
      openai_api_key TEXT NOT NULL,
      industry TEXT,
      blog_tone TEXT DEFAULT 'professional',
      publish_method TEXT DEFAULT 'manual',
      wordpress_url TEXT,
      wordpress_username TEXT,
      wordpress_app_password TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_for INTEGER,
      published_at INTEGER,
      topic TEXT,
      keywords TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS generation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT,
      tokens_used INTEGER,
      cost TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      license_key TEXT NOT NULL,
      device_fingerprint TEXT NOT NULL,
      activated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      last_validated_at INTEGER,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `);
  
  // Save database to file
  saveDatabase();
}

// Save database to file
function saveDatabase() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Initialize on module load
const dbPromise = initializeDatabase();

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(id: number, settings: Partial<InsertSettings>): Promise<Settings | undefined>;
  
  // Blog Posts
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPostsByStatus(status: string): Promise<BlogPost[]>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<void>;
  
  // Generation History
  createGenerationHistory(history: InsertGenerationHistory): Promise<GenerationHistory>;
  getGenerationHistory(limit?: number): Promise<GenerationHistory[]>;
  
  // License
  getLicense(): Promise<License | undefined>;
  createLicense(licenseData: InsertLicense): Promise<License>;
  updateLicenseStatus(id: number, status: string): Promise<void>;
  deleteLicense(id: number): Promise<void>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    await dbPromise;
    const result = db.select().from(users).where(eq(users.id, id)).limit(1).all();
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await dbPromise;
    const result = db.select().from(users).where(eq(users.username, username)).limit(1).all();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await dbPromise;
    const result = db.insert(users).values(insertUser).returning().get();
    saveDatabase();
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    await dbPromise;
    return db.select().from(users).all();
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    await dbPromise;
    const result = db.select().from(settings).limit(1).all();
    return result[0];
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    await dbPromise;
    const result = db.insert(settings).values(insertSettings).returning().get();
    saveDatabase();
    return result;
  }

  async updateSettings(id: number, updateData: Partial<InsertSettings>): Promise<Settings | undefined> {
    await dbPromise;
    const result = db.update(settings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(settings.id, id))
      .returning()
      .get();
    saveDatabase();
    return result;
  }

  // Blog Posts
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    await dbPromise;
    const result = db.insert(blogPosts).values(post).returning().get();
    saveDatabase();
    return result;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    await dbPromise;
    const result = db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1).all();
    return result[0];
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    await dbPromise;
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).all();
  }

  async getBlogPostsByStatus(status: string): Promise<BlogPost[]> {
    await dbPromise;
    return db.select().from(blogPosts).where(eq(blogPosts.status, status)).orderBy(desc(blogPosts.createdAt)).all();
  }

  async updateBlogPost(id: number, updateData: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    await dbPromise;
    const result = db.update(blogPosts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning()
      .get();
    saveDatabase();
    return result;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await dbPromise;
    db.delete(blogPosts).where(eq(blogPosts.id, id)).run();
    saveDatabase();
  }

  // Generation History
  async createGenerationHistory(history: InsertGenerationHistory): Promise<GenerationHistory> {
    await dbPromise;
    const result = db.insert(generationHistory).values(history).returning().get();
    saveDatabase();
    return result;
  }

  async getGenerationHistory(limit: number = 50): Promise<GenerationHistory[]> {
    await dbPromise;
    return db.select().from(generationHistory).orderBy(desc(generationHistory.createdAt)).limit(limit).all();
  }

  // License
  async getLicense(): Promise<License | undefined> {
    await dbPromise;
    const result = db.select().from(license).limit(1).all();
    return result[0];
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    await dbPromise;
    
    // Check if a license already exists
    const existing = db.select().from(license).limit(1).all();
    
    if (existing.length > 0) {
      // Update existing license instead of creating duplicate
      const result = db.update(license)
        .set({
          ...licenseData,
          lastValidatedAt: new Date(),
        })
        .where(eq(license.id, existing[0].id))
        .returning()
        .get();
      saveDatabase();
      return result;
    }
    
    // Create new license if none exists
    const result = db.insert(license).values(licenseData).returning().get();
    saveDatabase();
    return result;
  }

  async updateLicenseStatus(id: number, status: string): Promise<void> {
    await dbPromise;
    db.update(license)
      .set({ status, lastValidatedAt: new Date() })
      .where(eq(license.id, id))
      .run();
    saveDatabase();
  }

  async deleteLicense(id: number): Promise<void> {
    await dbPromise;
    db.delete(license).where(eq(license.id, id)).run();
    saveDatabase();
  }
}

export const storage = new DbStorage();
