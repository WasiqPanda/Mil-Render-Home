import express from "express";
import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import db from "./src/db/index";
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import cookieParser from 'cookie-parser';

const JWT_SECRET = process.env.JWT_SECRET || 'tactical-secret-key-change-in-prod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECR;
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set. Google Login will not work.");
  }
  
  let client: OAuth2Client | null = null;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  }

  const app = express();
app.set("trust proxy", 1);

  app.set('trust proxy', 1); // Trust first proxy (nginx)
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Seed Initial Super Admin
  const superAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('MajWahid@8993') as any;
  const hashedPassword = await bcrypt.hash('aunuANIKarny@8993', 10);
  
  if (!superAdmin) {
    db.prepare("INSERT INTO users (id, username, password, role, isApproved, status) VALUES (?, ?, ?, 'super_admin', 1, 'active')").run(
      'u-super-admin', 'MajWahid@8993', hashedPassword
    );
    console.log("Super Admin created: MajWahid@8993");
  } else {
    // Force update password to ensure it matches the provided one
    db.prepare("UPDATE users SET password = ?, role = 'super_admin', isApproved = 1, status = 'active' WHERE username = ?").run(
      hashedPassword, 'MajWahid@8993'
    );
    console.log("Super Admin credentials synchronized: MajWahid@8993");
  }

  // Seed Default HQs
  const hqCount = db.prepare('SELECT count(*) as count FROM hqs').get() as { count: number };
  if (hqCount.count === 0) {
    const insertHq = db.prepare('INSERT INTO hqs (id, name, location, createdAt) VALUES (?, ?, ?, ?)');
    insertHq.run('hq-dhaka', 'DHAKA HQ', 'Dhaka, Bangladesh', new Date().toISOString());
    insertHq.run('hq-chattogram', 'CHATTOGRAM HQ', 'Chattogram, Bangladesh', new Date().toISOString());
    insertHq.run('hq-sylhet', 'SYLHET HQ', 'Sylhet, Bangladesh', new Date().toISOString());
    console.log("Default HQs seeded");
  }

  // Socket.io Connection
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // --- AUTH ROUTES ---

  const getRedirectUri = (req: any) => {
    if (process.env.APP_URL) {
      return `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`;
    }
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const finalProtocol = host?.includes('.run.app') ? 'https' : protocol;
    return `${finalProtocol}://${host}/api/auth/google/callback`;
  };

  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = getRedirectUri(req);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Authorization code missing from Google redirect.");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials in environment variables.");
      return res.status(500).send("Server configuration error: Missing Google OAuth credentials.");
    }

    if (!client) {
      console.error("Google OAuth client not initialized.");
      return res.status(500).send("Server configuration error: Google OAuth client not initialized.");
    }

    try {
      const redirectUri = getRedirectUri(req);
      const { tokens } = await client.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });

      if (!tokens.id_token) {
        throw new Error("No ID token received from Google.");
      }

      const ticket = await client!.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID!
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("No payload");

      const { sub: googleId, email, name, picture } = payload;

      // Check if user exists
      let user = db.prepare('SELECT * FROM users WHERE googleId = ? OR email = ?').get(googleId, email) as any;

      if (!user) {
        // Create new user (pending approval)
        const id = `u-${Date.now()}`;
        db.prepare('INSERT INTO users (id, email, googleId, role, isApproved, status) VALUES (?, ?, ?, ?, ?, ?)').run(
          id, email, googleId, 'patrol_user', 0, 'pending'
        );
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, isApproved: user.isApproved },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

        res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}', user: ${JSON.stringify({ id: user.id, email: user.email, role: user.role, isApproved: !!user.isApproved })} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      res.status(500).send(`Authentication failed: ${error.message || 'Unknown error'}`);
    }
  });

  // --- RBAC MIDDLEWARE ---
  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ error: "Forbidden" });
        }
        req.user = decoded;
        next();
      } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
      }
    };
  };

  app.get("/api/auth/verify", authorize(['super_admin', 'operator', 'hq_control', 'patrol_user']), (req: any, res) => {
    const user = { ...req.user, isApproved: !!req.user.isApproved };
    res.json({ user });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, isApproved: user.isApproved },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?').run(new Date().toISOString(), user.id);

      res.json({ token, user: { id: user.id, username: user.username, role: user.role, isApproved: !!user.isApproved } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    // Simple registration for demo purposes - in real app, restrict this
    try {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existing) return res.status(400).json({ error: "Username taken" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = `u-${Date.now()}`;
      
      db.prepare('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)').run(
        id, username, hashedPassword, 'operator'
      );

      res.json({ success: true, message: "User registered" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // --- HQ & USER MANAGEMENT ROUTES ---

  // 1. List all HQs (Public/Authenticated)
  app.get("/api/hqs", (req, res) => {
    const hqs = db.prepare('SELECT id, name, location, additionalDetails FROM hqs').all();
    res.json(hqs);
  });

  // 2. Register HQ (Authorized Operators only)
  app.post("/api/hqs/register", authorize(['operator', 'hq_control']), (req: any, res) => {
    const { name, location, additionalDetails } = req.body;
    const operatorId = req.user.id;
    const hqId = `hq-${Date.now()}`;

    try {
      // Check if operator already has an HQ
      const existing = db.prepare('SELECT id FROM hqs WHERE operatorId = ?').get(operatorId);
      if (existing) return res.status(400).json({ error: "Operator already has a registered HQ" });

      db.prepare('INSERT INTO hqs (id, name, location, additionalDetails, operatorId, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(
        hqId, name, location, additionalDetails, operatorId, new Date().toISOString()
      );

      // Link operator to this HQ
      db.prepare('UPDATE users SET hqId = ? WHERE id = ?').run(hqId, operatorId);

      res.json({ success: true, hqId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "HQ registration failed" });
    }
  });

  // 3. Join Request (Patrol Users only)
  app.post("/api/users/join-request", authorize(['patrol_user']), (req: any, res) => {
    const { hqId } = req.body;
    const userId = req.user.id;

    try {
      db.prepare("UPDATE users SET hqId = ?, status = 'pending' WHERE id = ?").run(hqId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Join request failed" });
    }
  });

  // 4. Role-based User Listing
  app.get("/api/admin/users", authorize(['super_admin', 'operator', 'hq_control']), (req: any, res) => {
    const { role, id } = req.user;
    
    if (role === 'super_admin') {
      // Super Admin sees only Operators (and other admins)
      const users = db.prepare("SELECT id, username, email, role, isApproved, status, hqId FROM users WHERE role IN ('operator', 'hq_control', 'super_admin')").all();
      return res.json(users);
    } else {
      // Operator sees only Patrol Users requesting their HQ
      const operatorHq = db.prepare('SELECT id FROM hqs WHERE operatorId = ?').get(id) as any;
      if (!operatorHq) return res.json([]);
      
      const users = db.prepare("SELECT id, username, email, role, isApproved, status, hqId FROM users WHERE hqId = ? AND role = 'patrol_user'").all(operatorHq.id);
      return res.json(users);
    }
  });

  // 5. Role-based Approval
  app.post("/api/admin/users/:id/approve", authorize(['super_admin', 'operator', 'hq_control']), (req: any, res) => {
    const { id } = req.params;
    const { role: newRole, hqId } = req.body;
    const { role: adminRole, id: adminId } = req.user;

    try {
      if (adminRole === 'super_admin') {
        // Super Admin approves Operators
        db.prepare("UPDATE users SET isApproved = 1, status = 'active', role = ? WHERE id = ?").run(newRole || 'operator', id);
      } else {
        // Operator approves Patrol Users for their HQ
        const operatorHq = db.prepare('SELECT id FROM hqs WHERE operatorId = ?').get(adminId) as any;
        const targetUser = db.prepare('SELECT hqId FROM users WHERE id = ?').get(id) as any;

        if (!operatorHq || !targetUser || targetUser.hqId !== operatorHq.id) {
          return res.status(403).json({ error: "Unauthorized to approve this user" });
        }

        db.prepare("UPDATE users SET isApproved = 1, status = 'active' WHERE id = ?").run(id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Approval failed" });
    }
  });

  app.get("/api/admin/hqs", authorize(['super_admin', 'hq_control', 'operator']), (req, res) => {
    const hqs = db.prepare('SELECT * FROM hqs').all();
    res.json(hqs);
  });

  // --- OPERATOR ROUTES ---
  app.post("/api/operator/sessions", authorize(['hq_control', 'operator']), (req, res) => {
    const { hqId } = req.body;
    const sessionId = `sess-${Date.now()}`;
    db.prepare('INSERT INTO sessions (id, hqId, operatorId, startTime) VALUES (?, ?, ?, ?)').run(
      sessionId, hqId, (req as any).user.id, new Date().toISOString()
    );
    res.json({ sessionId });
  });

  // --- API ROUTES ---

  // GET /api/units
  app.get("/api/units", (req, res) => {
    try {
      const units = db.prepare('SELECT * FROM units').all();
      
      // Fetch paths for all units
      const paths = db.prepare('SELECT unit_id, lat, lng FROM unit_paths ORDER BY timestamp ASC').all();
      
      // Group paths by unit_id
      const pathsByUnit: Record<string, {lat: number, lng: number}[]> = {};
      paths.forEach((p: any) => {
        if (!pathsByUnit[p.unit_id]) pathsByUnit[p.unit_id] = [];
        pathsByUnit[p.unit_id].push({ lat: p.lat, lng: p.lng });
      });

      const formattedUnits = units.map((u: any) => ({
        ...u,
        position: { lat: u.lat, lng: u.lng },
        members: [], // Simplified for DB
        path: pathsByUnit[u.id] || []
      }));
      res.json(formattedUnits);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  // POST /api/units/:id/telemetry (Real GPS update or Registration)
  app.post("/api/units/:id/telemetry", (req, res) => {
    const { id } = req.params;
    const { lat, lng, heading, status, batteryLevel, signalStrength, callsign, type, currentTask } = req.body;
    
    try {
      // Check if unit exists
      const existing = db.prepare('SELECT id FROM units WHERE id = @id').get({ id });

      if (existing) {
        // Update existing unit
        const stmt = db.prepare(`
          UPDATE units 
          SET lat = COALESCE(@lat, lat),
              lng = COALESCE(@lng, lng),
              heading = COALESCE(@heading, heading),
              status = COALESCE(@status, status),
              batteryLevel = COALESCE(@batteryLevel, batteryLevel),
              signalStrength = COALESCE(@signalStrength, signalStrength),
              currentTask = COALESCE(@currentTask, currentTask),
              lastUpdate = @lastUpdate
          WHERE id = @id
        `);
        
        stmt.run({
          id, lat, lng, heading, status, batteryLevel, signalStrength, currentTask,
          lastUpdate: new Date().toISOString()
        });
      } else {
        // Register new unit
        const stmt = db.prepare(`
          INSERT INTO units (id, callsign, type, status, lat, lng, heading, batteryLevel, signalStrength, currentTask, lastUpdate)
          VALUES (@id, @callsign, @type, @status, @lat, @lng, @heading, @batteryLevel, @signalStrength, @currentTask, @lastUpdate)
        `);

        stmt.run({
          id,
          callsign: callsign || `UNIT-${id.slice(-4)}`,
          type: type || 'infantry',
          status: status || 'active',
          lat: lat || 0,
          lng: lng || 0,
          heading: heading || 0,
          batteryLevel: batteryLevel || 100,
          signalStrength: signalStrength || 100,
          currentTask: currentTask || 'STANDING BY',
          lastUpdate: new Date().toISOString()
        });
      }

      // Record history if position changed and is valid
      if (lat !== undefined && lng !== undefined) {
        const pathStmt = db.prepare(`
          INSERT INTO unit_paths (unit_id, lat, lng, timestamp)
          VALUES (@unit_id, @lat, @lng, @timestamp)
        `);
        pathStmt.run({
          unit_id: id,
          lat,
          lng,
          timestamp: new Date().toISOString()
        });
      }
      
      // Emit update to all clients
      io.emit('units:update');
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update telemetry" });
    }
  });

  // --- ADMIN ROUTES ---

  // POST /api/admin/reset
  app.post("/api/admin/reset", (req, res) => {
    try {
      db.prepare('DELETE FROM units').run();
      db.prepare('DELETE FROM incidents').run();
      db.prepare('DELETE FROM unit_paths').run();
      db.prepare('DELETE FROM alerts').run();
      res.json({ success: true, message: "System reset complete" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to reset system" });
    }
  });

  // GET /api/incidents
  app.get("/api/incidents", (req, res) => {
    try {
      const incidents = db.prepare('SELECT * FROM incidents ORDER BY timestamp DESC').all();
      const formattedIncidents = incidents.map((i: any) => ({
        ...i,
        position: { lat: i.lat, lng: i.lng }
      }));
      res.json(formattedIncidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  // POST /api/incidents
  app.post("/api/incidents", (req, res) => {
    const { id, type, priority, position, description, status, reportedBy, timestamp } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO incidents (id, type, priority, lat, lng, description, status, reportedBy, timestamp)
        VALUES (@id, @type, @priority, @lat, @lng, @description, @status, @reportedBy, @timestamp)
      `);
      
      stmt.run({
        id, type, priority,
        lat: position.lat,
        lng: position.lng,
        description, status, reportedBy, timestamp
      });
      
      io.emit('incidents:update');
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  // PUT /api/incidents/:id
  app.put("/api/incidents/:id", (req, res) => {
    const { id } = req.params;
    const { status, description, priority, type } = req.body;
    
    try {
      // Dynamic update query
      const updates = [];
      const params: any = { id };

      if (status) { updates.push("status = @status"); params.status = status; }
      if (description) { updates.push("description = @description"); params.description = description; }
      if (priority) { updates.push("priority = @priority"); params.priority = priority; }
      if (type) { updates.push("type = @type"); params.type = type; }

      if (updates.length === 0) return res.json({ success: true }); // Nothing to update

      const stmt = db.prepare(`
        UPDATE incidents 
        SET ${updates.join(", ")}
        WHERE id = @id
      `);
      
      const info = stmt.run(params);
      
      if (info.changes === 0) {
        return res.status(404).json({ error: "Incident not found" });
      }
      
      io.emit('incidents:update');
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update incident" });
    }
  });

  // DELETE /api/incidents/:id
  app.delete("/api/incidents/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare('DELETE FROM incidents WHERE id = @id');
      const info = stmt.run({ id });
      
      if (info.changes === 0) {
        return res.status(404).json({ error: "Incident not found" });
      }
      
      io.emit('incidents:update');
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete incident" });
    }
  });

  // --- SETTINGS / SUBSCRIPTION API ---

  // GET /api/settings
  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM app_settings').all();
      const settingsObj: Record<string, string> = {};
      settings.forEach((s: any) => {
        settingsObj[s.key] = s.value;
      });
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // POST /api/settings/upgrade
  app.post("/api/settings/upgrade", (req, res) => {
    const { tier } = req.body; // 'basic' or 'premium'
    
    try {
      let expiryDate = new Date();
      if (tier === 'basic') {
        // $20 for 1 month
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (tier === 'premium') {
        // $50 for 1 month
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else {
        return res.status(400).json({ error: "Invalid tier" });
      }

      const updateTier = db.prepare('UPDATE app_settings SET value = @value WHERE key = "tier"');
      const updateExpiry = db.prepare('UPDATE app_settings SET value = @value WHERE key = "expiry_date"');

      updateTier.run({ value: tier });
      updateExpiry.run({ value: expiryDate.toISOString() });

      res.json({ success: true, tier, expiry_date: expiryDate.toISOString() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to upgrade" });
    }
  });

  // POST /api/settings/extend (Admin)
  app.post("/api/settings/extend", (req, res) => {
    const { days } = req.body;
    
    try {
      const currentExpiryRow = db.prepare('SELECT value FROM app_settings WHERE key = "expiry_date"').get() as { value: string };
      let currentExpiry = new Date(currentExpiryRow.value);
      
      // If already expired, start from now
      if (currentExpiry < new Date()) {
        currentExpiry = new Date();
      }

      currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));

      const updateExpiry = db.prepare('UPDATE app_settings SET value = @value WHERE key = "expiry_date"');
      updateExpiry.run({ value: currentExpiry.toISOString() });

      res.json({ success: true, expiry_date: currentExpiry.toISOString() });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to extend time" });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
