import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertReviewSchema, insertPoemSchema, insertAdminUserSchema } from "@shared/schema";
import { getUncachableResendClient } from "./lib/resend";
import { ZodError } from "zod";

// Authentication middleware - verifies admin status
async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  const token = authHeader.substring(7);
  
  try {
    // Extract email from token (format: "email:timestamp" for local auth)
    let email = '';
    if (token.includes(':')) {
      email = token.split(':')[0];
    } else if (token === 'local-admin-token') {
      email = 'godswillpatrick60@gmail.com';
    } else {
      // For Supabase tokens, we'd decode JWT here
      // For now, assume it's a valid email
      email = token;
    }
    
    // Check if user is an approved admin
    const adminUser = await storage.getAdminUserByEmail(email);
    if (!adminUser || adminUser.status !== 'approved') {
      return res.status(403).json({ error: "Access denied. Admin approval required." });
    }
    
    // Attach admin info to request for downstream use
    (req as any).adminUser = adminUser;
    next();
  } catch (error) {
    console.error("Auth verification error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Middleware to require super admin role
async function requireSuperAdmin(req: any, res: any, next: any) {
  const adminUser = (req as any).adminUser;
  if (!adminUser || adminUser.role !== 'super_admin') {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      
      // Store the contact message
      const contactMessage = await storage.createContactMessage(validatedData);
      
      // Send email notification using Resend
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        
        await client.emails.send({
          from: fromEmail,
          to: 'godswillpatrick60@gmail.com',
          subject: `New Contact Form Message from ${validatedData.name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            <p><strong>Message:</strong></p>
            <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending contact email:", emailError);
      }

      res.json({ success: true, contactMessage });
    } catch (error: any) {
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

  // Review submission endpoint
  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Store the review
      const review = await storage.createReview(validatedData);
      
      // Send email notification using Resend
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        
        const stars = '★'.repeat(validatedData.rating) + '☆'.repeat(5 - validatedData.rating);
        
        await client.emails.send({
          from: fromEmail,
          to: 'godswillpatrick60@gmail.com',
          subject: `New Review: ${stars} - ${validatedData.name}`,
          html: `
            <h2>New Poem Review Submitted</h2>
            <p><strong>Poem:</strong> ${validatedData.post_slug}</p>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            ${validatedData.email ? `<p><strong>Email:</strong> ${validatedData.email}</p>` : ''}
            <p><strong>Rating:</strong> ${stars} (${validatedData.rating}/5)</p>
            <p><strong>Comment:</strong></p>
            <p>${validatedData.comment.replace(/\n/g, '<br>')}</p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending review email:", emailError);
      }

      res.json({ success: true, review });
    } catch (error: any) {
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

  // Get all poems endpoint
  app.get("/api/poems", async (_req, res) => {
    try {
      const poems = await storage.getAllPoems();
      res.json(poems);
    } catch (error) {
      console.error("Error retrieving poems:", error);
      res.status(500).json({ error: "Failed to retrieve poems" });
    }
  });

  // Poem creation endpoint (requires authentication)
  app.post("/api/poems", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPoemSchema.parse(req.body);
      
      // Create the poem in storage
      const poem = await storage.createPoem(validatedData);

      res.json({ success: true, poem });
    } catch (error: any) {
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

  // Admin user management endpoints
  
  // Request admin access (public endpoint)
  app.post("/api/admin/request", async (req, res) => {
    try {
      const validatedData = insertAdminUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getAdminUserByEmail(validatedData.email);
      if (existing) {
        return res.status(400).json({ 
          error: "An admin request already exists for this email address." 
        });
      }
      
      // Create admin request
      const adminUser = await storage.createAdminRequest(validatedData);
      
      // Send email notification to super admin
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        
        await client.emails.send({
          from: fromEmail,
          to: 'godswillpatrick60@gmail.com',
          subject: `New Admin Access Request from ${validatedData.name}`,
          html: `
            <h2>New Admin Access Request</h2>
            <p><strong>Name:</strong> ${validatedData.name}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            ${validatedData.message ? `<p><strong>Message:</strong></p><p>${validatedData.message.replace(/\n/g, '<br>')}</p>` : ''}
            <p>Please log in to your admin dashboard to approve or reject this request.</p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending admin request email:", emailError);
        // Continue anyway - the request is saved
      }
      
      res.json({ 
        success: true, 
        message: "Your admin access request has been submitted. You will be notified once approved." 
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid request data." });
      }
      console.error("Error creating admin request:", error);
      res.status(500).json({ error: "Failed to submit admin request." });
    }
  });
  
  // Get pending admin requests (super admin only)
  app.get("/api/admin/requests/pending", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const requests = await storage.getPendingAdminRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });
  
  // Get all admin users (super admin only)
  app.get("/api/admin/users", requireAuth, requireSuperAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllAdminUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });
  
  // Approve admin request (super admin only)
  app.post("/api/admin/approve/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const approvedBy = (req as any).adminUser.email;
      
      const user = await storage.approveAdminUser(id, approvedBy);
      
      // Send approval email
      try {
        const { client, fromEmail } = await getUncachableResendClient();
        
        await client.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Your Admin Access Request Has Been Approved',
          html: `
            <h2>Congratulations!</h2>
            <p>Your admin access request has been approved. You can now log in to post poems on Verses & Reflections.</p>
            <p>Visit the admin login page to get started.</p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }
      
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error approving admin:", error);
      res.status(500).json({ error: error.message || "Failed to approve admin request" });
    }
  });
  
  // Reject admin request (super admin only)
  app.post("/api/admin/reject/:id", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.rejectAdminUser(id);
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error rejecting admin:", error);
      res.status(500).json({ error: error.message || "Failed to reject admin request" });
    }
  });
  
  // Check admin status by email (for login verification)
  app.post("/api/admin/check-status", async (req, res) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
