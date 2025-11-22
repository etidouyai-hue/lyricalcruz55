var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  POEM_CATEGORIES: () => POEM_CATEGORIES,
  adminRequestSchema: () => adminRequestSchema,
  adminUsers: () => adminUsers,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertContactSchema: () => insertContactSchema,
  insertPoemSchema: () => insertPoemSchema,
  insertReviewSchema: () => insertReviewSchema
});
import { z } from "zod";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var insertReviewSchema, insertContactSchema, insertPoemSchema, adminRequestSchema, adminUsers, insertAdminUserSchema, POEM_CATEGORIES;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    insertReviewSchema = z.object({
      post_slug: z.string().min(1),
      name: z.string().min(1).max(100),
      email: z.string().email().optional().nullable(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(1).max(1e3)
    });
    insertContactSchema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      message: z.string().min(1).max(2e3)
    });
    insertPoemSchema = z.object({
      title: z.string().min(1).max(200),
      category: z.enum(["Love", "Life", "Family", "Modern Life", "Nature"]),
      excerpt: z.string().min(1).max(500),
      poem: z.array(z.string()).min(1).max(100)
    });
    adminRequestSchema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      message: z.string().min(1).max(500).optional()
    });
    adminUsers = pgTable("admin_users", {
      id: uuid("id").primaryKey().defaultRandom(),
      email: text("email").notNull().unique(),
      name: text("name").notNull(),
      status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
      role: text("role", { enum: ["super_admin", "admin"] }).notNull().default("admin"),
      message: text("message"),
      requestedAt: timestamp("requested_at").notNull().defaultNow(),
      approvedAt: timestamp("approved_at"),
      approvedBy: text("approved_by")
    });
    insertAdminUserSchema = createInsertSchema(adminUsers).omit({
      id: true,
      requestedAt: true,
      approvedAt: true,
      approvedBy: true,
      status: true,
      role: true
    });
    POEM_CATEGORIES = ["All", "Love", "Life", "Family", "Modern Life", "Nature"];
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/index-prod.ts
import fs from "node:fs";
import path from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  contactMessages;
  reviews;
  poems;
  adminUsers;
  constructor() {
    this.contactMessages = /* @__PURE__ */ new Map();
    this.reviews = /* @__PURE__ */ new Map();
    this.poems = /* @__PURE__ */ new Map();
    this.adminUsers = /* @__PURE__ */ new Map();
    this.loadInitialPoems();
    this.initializeSuperAdmin();
  }
  async initializeSuperAdmin() {
    const superAdminEmail = "godswillpatrick60@gmail.com";
    if (!this.adminUsers.has(superAdminEmail)) {
      const superAdmin = {
        id: randomUUID(),
        email: superAdminEmail,
        name: "Super Admin",
        status: "approved",
        role: "super_admin",
        message: null,
        requestedAt: /* @__PURE__ */ new Date(),
        approvedAt: /* @__PURE__ */ new Date(),
        approvedBy: null
      };
      this.adminUsers.set(superAdminEmail, superAdmin);
    }
  }
  async loadInitialPoems() {
    try {
      const fs2 = await import("fs/promises");
      const path2 = await import("path");
      const poemsPath = path2.join(process.cwd(), "client/public/poems.json");
      const data = await fs2.readFile(poemsPath, "utf-8");
      const poems = JSON.parse(data);
      poems.forEach((poem) => {
        this.poems.set(poem.slug, poem);
      });
    } catch (error) {
      console.log("No initial poems to load or error loading:", error);
    }
  }
  async createContactMessage(contact) {
    const id = randomUUID();
    const contactMessage = {
      id,
      ...contact,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.contactMessages.set(id, contactMessage);
    return contactMessage;
  }
  async createReview(insertReview) {
    const id = randomUUID();
    const review = {
      id,
      post_slug: insertReview.post_slug,
      name: insertReview.name,
      email: insertReview.email ?? null,
      rating: insertReview.rating,
      comment: insertReview.comment,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.reviews.set(id, review);
    return review;
  }
  async createPoem(insertPoem) {
    let slug = insertPoem.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    let finalSlug = slug;
    let counter = 1;
    while (this.poems.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    const poem = {
      slug: finalSlug,
      title: insertPoem.title,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // YYYY-MM-DD
      category: insertPoem.category,
      excerpt: insertPoem.excerpt,
      poem: insertPoem.poem
    };
    this.poems.set(finalSlug, poem);
    await this.savePoemsToFile();
    return poem;
  }
  async savePoemsToFile() {
    try {
      const fs2 = await import("fs/promises");
      const path2 = await import("path");
      const poemsPath = path2.join(process.cwd(), "client/public/poems.json");
      const poemsArray = await this.getAllPoems();
      await fs2.writeFile(poemsPath, JSON.stringify(poemsArray, null, 2));
    } catch (error) {
      console.error("Error saving poems to file:", error);
      throw error;
    }
  }
  async getAllPoems() {
    return Array.from(this.poems.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  async createAdminRequest(request) {
    const id = randomUUID();
    const adminUser = {
      id,
      email: request.email,
      name: request.name,
      message: request.message ?? null,
      status: "pending",
      role: "admin",
      requestedAt: /* @__PURE__ */ new Date(),
      approvedAt: null,
      approvedBy: null
    };
    this.adminUsers.set(id, adminUser);
    return adminUser;
  }
  async getAdminUserByEmail(email) {
    const users = Array.from(this.adminUsers.values());
    return users.find((u) => u.email === email) || null;
  }
  async getPendingAdminRequests() {
    return Array.from(this.adminUsers.values()).filter((u) => u.status === "pending").sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }
  async getAllAdminUsers() {
    return Array.from(this.adminUsers.values()).sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }
  async approveAdminUser(id, approvedBy) {
    const user = this.adminUsers.get(id);
    if (!user) {
      throw new Error("Admin user not found");
    }
    user.status = "approved";
    user.approvedAt = /* @__PURE__ */ new Date();
    user.approvedBy = approvedBy;
    this.adminUsers.set(id, user);
    return user;
  }
  async rejectAdminUser(id) {
    const user = this.adminUsers.get(id);
    if (!user) {
      throw new Error("Admin user not found");
    }
    user.status = "rejected";
    this.adminUsers.set(id, user);
    return user;
  }
};
var DatabaseStorage = class {
  db;
  constructor() {
    Promise.resolve().then(() => (init_db(), db_exports)).then(({ db: db2 }) => {
      this.db = db2;
      this.initializeSuperAdmin();
    });
  }
  async initializeSuperAdmin() {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq } = await import("drizzle-orm");
    const superAdminEmail = "godswillpatrick60@gmail.com";
    const [existing] = await db2.select().from(adminUsers2).where(eq(adminUsers2.email, superAdminEmail));
    if (!existing) {
      await db2.insert(adminUsers2).values({
        email: superAdminEmail,
        name: "Super Admin",
        status: "approved",
        role: "super_admin",
        approvedAt: /* @__PURE__ */ new Date()
      });
    }
  }
  async createContactMessage(contact) {
    const id = randomUUID();
    return {
      id,
      ...contact,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async createReview(insertReview) {
    const id = randomUUID();
    return {
      id,
      post_slug: insertReview.post_slug,
      name: insertReview.name,
      email: insertReview.email ?? null,
      rating: insertReview.rating,
      comment: insertReview.comment,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async createPoem(insertPoem) {
    let slug = insertPoem.title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    const poem = {
      slug,
      title: insertPoem.title,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      category: insertPoem.category,
      excerpt: insertPoem.excerpt,
      poem: insertPoem.poem
    };
    const fs2 = await import("fs/promises");
    const path2 = await import("path");
    const poemsPath = path2.join(process.cwd(), "client/public/poems.json");
    let poems = [];
    try {
      const data = await fs2.readFile(poemsPath, "utf-8");
      poems = JSON.parse(data);
    } catch (error) {
    }
    poems.push(poem);
    await fs2.writeFile(poemsPath, JSON.stringify(poems, null, 2));
    return poem;
  }
  async getAllPoems() {
    const fs2 = await import("fs/promises");
    const path2 = await import("path");
    const poemsPath = path2.join(process.cwd(), "client/public/poems.json");
    try {
      const data = await fs2.readFile(poemsPath, "utf-8");
      const poems = JSON.parse(data);
      return poems.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      return [];
    }
  }
  async createAdminRequest(request) {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [user] = await db2.insert(adminUsers2).values(request).returning();
    return user;
  }
  async getAdminUserByEmail(email) {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq } = await import("drizzle-orm");
    const [user] = await db2.select().from(adminUsers2).where(eq(adminUsers2.email, email));
    return user || null;
  }
  async getPendingAdminRequests() {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq, desc } = await import("drizzle-orm");
    return await db2.select().from(adminUsers2).where(eq(adminUsers2.status, "pending")).orderBy(desc(adminUsers2.requestedAt));
  }
  async getAllAdminUsers() {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { desc } = await import("drizzle-orm");
    return await db2.select().from(adminUsers2).orderBy(desc(adminUsers2.requestedAt));
  }
  async approveAdminUser(id, approvedBy) {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq } = await import("drizzle-orm");
    const [user] = await db2.update(adminUsers2).set({
      status: "approved",
      approvedAt: /* @__PURE__ */ new Date(),
      approvedBy
    }).where(eq(adminUsers2.id, id)).returning();
    if (!user) {
      throw new Error("Admin user not found");
    }
    return user;
  }
  async rejectAdminUser(id) {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { adminUsers: adminUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq } = await import("drizzle-orm");
    const [user] = await db2.update(adminUsers2).set({ status: "rejected" }).where(eq(adminUsers2.id, id)).returning();
    if (!user) {
      throw new Error("Admin user not found");
    }
    return user;
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

// server/routes.ts
init_schema();

// server/lib/resend.ts
import { Resend } from "resend";
var connectionSettings;
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}
async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

// server/routes.ts
import { ZodError } from "zod";
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  const token = authHeader.substring(7);
  try {
    let email = "";
    if (token.includes(":")) {
      email = token.split(":")[0];
    } else if (token === "local-admin-token") {
      email = "godswillpatrick60@gmail.com";
    } else {
      email = token;
    }
    const adminUser = await storage.getAdminUserByEmail(email);
    if (!adminUser || adminUser.status !== "approved") {
      return res.status(403).json({ error: "Access denied. Admin approval required." });
    }
    req.adminUser = adminUser;
    next();
  } catch (error) {
    console.error("Auth verification error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
async function requireSuperAdmin(req, res, next) {
  const adminUser = req.adminUser;
  if (!adminUser || adminUser.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}
async function registerRoutes(app2) {
  app2.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contactMessage = await storage.createContactMessage(validatedData);
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        await client.emails.send({
          from: fromEmail,
          to: "godswillpatrick60@gmail.com",
          subject: `New Contact Form Message from ${validatedData.name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            <p><strong>Message:</strong></p>
            <p>${validatedData.message.replace(/\n/g, "<br>")}</p>
          `
        });
      } catch (emailError) {
        console.error("Error sending contact email:", emailError);
      }
      res.json({ success: true, contactMessage });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid form data. Please check your inputs."
        });
      }
      console.error("Error processing contact submission:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while processing your message. Please try again."
      });
    }
  });
  app2.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        const stars = "\u2605".repeat(validatedData.rating) + "\u2606".repeat(5 - validatedData.rating);
        await client.emails.send({
          from: fromEmail,
          to: "godswillpatrick60@gmail.com",
          subject: `New Review: ${stars} - ${validatedData.name}`,
          html: `
            <h2>New Poem Review Submitted</h2>
            <p><strong>Poem:</strong> ${validatedData.post_slug}</p>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            ${validatedData.email ? `<p><strong>Email:</strong> ${validatedData.email}</p>` : ""}
            <p><strong>Rating:</strong> ${stars} (${validatedData.rating}/5)</p>
            <p><strong>Comment:</strong></p>
            <p>${validatedData.comment.replace(/\n/g, "<br>")}</p>
          `
        });
      } catch (emailError) {
        console.error("Error sending review email:", emailError);
      }
      res.json({ success: true, review });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid form data. Please check your inputs."
        });
      }
      console.error("Error processing review submission:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while processing your review. Please try again."
      });
    }
  });
  app2.get("/api/poems", async (_req, res) => {
    try {
      const poems = await storage.getAllPoems();
      res.json(poems);
    } catch (error) {
      console.error("Error retrieving poems:", error);
      res.status(500).json({ error: "Failed to retrieve poems" });
    }
  });
  app2.post("/api/poems", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPoemSchema.parse(req.body);
      const poem = await storage.createPoem(validatedData);
      res.json({ success: true, poem });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid poem data. Please check your inputs."
        });
      }
      console.error("Error saving poem:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while saving the poem. Please try again."
      });
    }
  });
  app2.post("/api/admin/request", async (req, res) => {
    try {
      const validatedData = insertAdminUserSchema.parse(req.body);
      const existing = await storage.getAdminUserByEmail(validatedData.email);
      if (existing) {
        return res.status(400).json({
          error: "An admin request already exists for this email address."
        });
      }
      const adminUser = await storage.createAdminRequest(validatedData);
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        await client.emails.send({
          from: fromEmail,
          to: "godswillpatrick60@gmail.com",
          subject: `New Admin Access Request from ${validatedData.name}`,
          html: `
            <h2>New Admin Access Request</h2>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            ${validatedData.message ? `<p><strong>Message:</strong></p><p>${validatedData.message.replace(/\n/g, "<br>")}</p>` : ""}
            <p>Please log in to your admin dashboard to approve or reject this request.</p>
          `
        });
      } catch (emailError) {
        console.error("Error sending admin request email:", emailError);
      }
      res.json({
        success: true,
        message: "Your admin access request has been submitted. You will be notified once approved."
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid request data." });
      }
      console.error("Error creating admin request:", error);
      res.status(500).json({ error: "Failed to submit admin request." });
    }
  });
  app2.get("/api/admin/requests/pending", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const requests = await storage.getPendingAdminRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });
  app2.get("/api/admin/users", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllAdminUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });
  app2.post("/api/admin/approve/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const approvedBy = req.adminUser.email;
      const user = await storage.approveAdminUser(id, approvedBy);
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        await client.emails.send({
          from: fromEmail,
          to: user.email,
          subject: "Your Admin Access Request Has Been Approved",
          html: `
            <h2>Congratulations!</h2>
            <p>Your admin access request has been approved. You can now log in to post poems on Verses & Reflections.</p>
            <p>Visit the admin login page to get started.</p>
          `
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error approving admin:", error);
      res.status(500).json({ error: error.message || "Failed to approve admin request" });
    }
  });
  app2.post("/api/admin/reject/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.rejectAdminUser(id);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error rejecting admin:", error);
      res.status(500).json({ error: error.message || "Failed to reject admin request" });
    }
  });
  app2.post("/api/admin/check-status", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      const adminUser = await storage.getAdminUserByEmail(email);
      if (!adminUser) {
        return res.json({ exists: false });
      }
      res.json({
        exists: true,
        status: adminUser.status,
        role: adminUser.role
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
async function serveStatic(app2, _server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
