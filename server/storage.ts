import { type ContactMessage, type InsertContact, type Review, type InsertReview, type Poem, type InsertPoem, type AdminUserDb, type InsertAdminUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createContactMessage(contact: InsertContact): Promise<ContactMessage>;
  createReview(review: InsertReview): Promise<Review>;
  createPoem(poem: InsertPoem): Promise<Poem>;
  getAllPoems(): Promise<Poem[]>;
  
  // Admin user management
  createAdminRequest(request: InsertAdminUser): Promise<AdminUserDb>;
  getAdminUserByEmail(email: string): Promise<AdminUserDb | null>;
  getPendingAdminRequests(): Promise<AdminUserDb[]>;
  getAllAdminUsers(): Promise<AdminUserDb[]>;
  approveAdminUser(id: string, approvedBy: string): Promise<AdminUserDb>;
  rejectAdminUser(id: string): Promise<AdminUserDb>;
}

export class MemStorage implements IStorage {
  private contactMessages: Map<string, ContactMessage>;
  private reviews: Map<string, Review>;
  private poems: Map<string, Poem>;
  private adminUsers: Map<string, AdminUserDb>;

  constructor() {
    this.contactMessages = new Map();
    this.reviews = new Map();
    this.poems = new Map();
    this.adminUsers = new Map();
    
    // Load initial poems from JSON file if available
    this.loadInitialPoems();
    
    // Initialize super admin
    this.initializeSuperAdmin();
  }
  
  private async initializeSuperAdmin() {
    const superAdminEmail = "godswillpatrick60@gmail.com";
    if (!this.adminUsers.has(superAdminEmail)) {
      const superAdmin: AdminUserDb = {
        id: randomUUID(),
        email: superAdminEmail,
        name: "Super Admin",
        status: "approved",
        role: "super_admin",
        message: null,
        requestedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: null,
      };
      this.adminUsers.set(superAdminEmail, superAdmin);
    }
  }
  
  private async loadInitialPoems() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const poemsPath = path.join(process.cwd(), 'client/public/poems.json');
      const data = await fs.readFile(poemsPath, 'utf-8');
      const poems: Poem[] = JSON.parse(data);
      poems.forEach(poem => {
        this.poems.set(poem.slug, poem);
      });
    } catch (error) {
      console.log('No initial poems to load or error loading:', error);
    }
  }

  async createContactMessage(contact: InsertContact): Promise<ContactMessage> {
    const id = randomUUID();
    const contactMessage: ContactMessage = {
      id,
      ...contact,
      created_at: new Date().toISOString(),
    };
    this.contactMessages.set(id, contactMessage);
    return contactMessage;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      id,
      post_slug: insertReview.post_slug,
      name: insertReview.name,
      email: insertReview.email ?? null,
      rating: insertReview.rating,
      comment: insertReview.comment,
      created_at: new Date().toISOString(),
    };
    this.reviews.set(id, review);
    return review;
  }

  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    // Generate slug from title
    let slug = insertPoem.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check for slug collisions and append number if needed
    let finalSlug = slug;
    let counter = 1;
    while (this.poems.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const poem: Poem = {
      slug: finalSlug,
      title: insertPoem.title,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      category: insertPoem.category,
      excerpt: insertPoem.excerpt,
      poem: insertPoem.poem,
    };

    this.poems.set(finalSlug, poem);
    
    // Persist to JSON file
    await this.savePoemsToFile();
    
    return poem;
  }
  
  private async savePoemsToFile() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const poemsPath = path.join(process.cwd(), 'client/public/poems.json');
      
      const poemsArray = await this.getAllPoems();
      await fs.writeFile(poemsPath, JSON.stringify(poemsArray, null, 2));
    } catch (error) {
      console.error('Error saving poems to file:', error);
      throw error;
    }
  }

  async getAllPoems(): Promise<Poem[]> {
    // Return poems sorted by date (newest first)
    return Array.from(this.poems.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createAdminRequest(request: InsertAdminUser): Promise<AdminUserDb> {
    const id = randomUUID();
    const adminUser: AdminUserDb = {
      id,
      email: request.email,
      name: request.name,
      message: request.message ?? null,
      status: "pending",
      role: "admin",
      requestedAt: new Date(),
      approvedAt: null,
      approvedBy: null,
    };
    this.adminUsers.set(id, adminUser);
    return adminUser;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUserDb | null> {
    const users = Array.from(this.adminUsers.values());
    return users.find(u => u.email === email) || null;
  }

  async getPendingAdminRequests(): Promise<AdminUserDb[]> {
    return Array.from(this.adminUsers.values())
      .filter(u => u.status === "pending")
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async getAllAdminUsers(): Promise<AdminUserDb[]> {
    return Array.from(this.adminUsers.values())
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async approveAdminUser(id: string, approvedBy: string): Promise<AdminUserDb> {
    const user = this.adminUsers.get(id);
    if (!user) {
      throw new Error("Admin user not found");
    }
    user.status = "approved";
    user.approvedAt = new Date();
    user.approvedBy = approvedBy;
    this.adminUsers.set(id, user);
    return user;
  }

  async rejectAdminUser(id: string): Promise<AdminUserDb> {
    const user = this.adminUsers.get(id);
    if (!user) {
      throw new Error("Admin user not found");
    }
    user.status = "rejected";
    this.adminUsers.set(id, user);
    return user;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private db: any;
  
  constructor() {
    // Initialize database connection
    import('./db').then(({ db }) => {
      this.db = db;
      this.initializeSuperAdmin();
    });
  }
  
  private async initializeSuperAdmin() {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const superAdminEmail = "godswillpatrick60@gmail.com";
    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, superAdminEmail));
    
    if (!existing) {
      await db.insert(adminUsers).values({
        email: superAdminEmail,
        name: "Super Admin",
        status: "approved",
        role: "super_admin",
        approvedAt: new Date(),
      });
    }
  }

  async createContactMessage(contact: InsertContact): Promise<ContactMessage> {
    const id = randomUUID();
    return {
      id,
      ...contact,
      created_at: new Date().toISOString(),
    };
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    return {
      id,
      post_slug: insertReview.post_slug,
      name: insertReview.name,
      email: insertReview.email ?? null,
      rating: insertReview.rating,
      comment: insertReview.comment,
      created_at: new Date().toISOString(),
    };
  }

  async createPoem(insertPoem: InsertPoem): Promise<Poem> {
    let slug = insertPoem.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const poem: Poem = {
      slug,
      title: insertPoem.title,
      date: new Date().toISOString().split('T')[0],
      category: insertPoem.category,
      excerpt: insertPoem.excerpt,
      poem: insertPoem.poem,
    };

    // Save to JSON file
    const fs = await import('fs/promises');
    const path = await import('path');
    const poemsPath = path.join(process.cwd(), 'client/public/poems.json');
    
    let poems: Poem[] = [];
    try {
      const data = await fs.readFile(poemsPath, 'utf-8');
      poems = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }
    
    poems.push(poem);
    await fs.writeFile(poemsPath, JSON.stringify(poems, null, 2));
    
    return poem;
  }

  async getAllPoems(): Promise<Poem[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const poemsPath = path.join(process.cwd(), 'client/public/poems.json');
    
    try {
      const data = await fs.readFile(poemsPath, 'utf-8');
      const poems: Poem[] = JSON.parse(data);
      return poems.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  async createAdminRequest(request: InsertAdminUser): Promise<AdminUserDb> {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    
    const [user] = await db.insert(adminUsers).values(request).returning();
    return user;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUserDb | null> {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || null;
  }

  async getPendingAdminRequests(): Promise<AdminUserDb[]> {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');
    
    return await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.status, "pending"))
      .orderBy(desc(adminUsers.requestedAt));
  }

  async getAllAdminUsers(): Promise<AdminUserDb[]> {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    const { desc } = await import('drizzle-orm');
    
    return await db.select()
      .from(adminUsers)
      .orderBy(desc(adminUsers.requestedAt));
  }

  async approveAdminUser(id: string, approvedBy: string): Promise<AdminUserDb> {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await db.update(adminUsers)
      .set({
        status: "approved",
        approvedAt: new Date(),
        approvedBy,
      })
      .where(eq(adminUsers.id, id))
      .returning();
    
    if (!user) {
      throw new Error("Admin user not found");
    }
    return user;
  }

  async rejectAdminUser(id: string): Promise<AdminUserDb> {
    const { db } = await import('./db');
    const { adminUsers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await db.update(adminUsers)
      .set({ status: "rejected" })
      .where(eq(adminUsers.id, id))
      .returning();
    
    if (!user) {
      throw new Error("Admin user not found");
    }
    return user;
  }
}

// Use DatabaseStorage if DATABASE_URL is available, otherwise use MemStorage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
