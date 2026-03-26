import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Encryption helper
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_secret_key_32_chars_long_!!";
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Mock Database for demo purposes (In real app, this would be Firestore/Postgres)
// We'll use this to store scheduled posts that the cron job will pick up.
let scheduledPosts: any[] = [];

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// OAuth URL Generation
app.get("/api/auth/:platform/url", (req, res) => {
  const { platform } = req.params;
  const redirectUri = `${process.env.APP_URL}/auth/${platform}/callback`;
  
  let authUrl = "";
  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];

  if (!clientId) {
    return res.status(400).json({ error: `Missing CLIENT_ID for ${platform}` });
  }

  switch (platform) {
    case "facebook":
      authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=pages_manage_posts,pages_read_engagement`;
      break;
    case "instagram":
      authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=instagram_basic,instagram_content_publish&response_type=code`;
      break;
    case "x":
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20tweet.write%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
      break;
    // Add others as needed
    default:
      return res.status(400).json({ error: "Unsupported platform" });
  }

  res.json({ url: authUrl });
});

// OAuth Callback
app.get("/auth/:platform/callback", async (req, res) => {
  const { platform } = req.params;
  const { code } = req.query;

  // In a real app, exchange code for token here
  // const tokenResponse = await axios.post(...);
  // const accessToken = tokenResponse.data.access_token;
  
  // For demo, we'll just simulate a successful token exchange
  const mockToken = encrypt(`mock_token_for_${platform}_${Date.now()}`);

  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              platform: '${platform}',
              token: '${mockToken}'
            }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

// Scheduling API
app.post("/api/social/schedule", (req, res) => {
  const post = req.body;
  scheduledPosts.push({ ...post, id: Math.random().toString(36).substr(2, 9) });
  res.json({ success: true, message: "Post scheduled successfully" });
});

app.get("/api/social/scheduled", (req, res) => {
  res.json(scheduledPosts);
});

// Cron Job for Scheduling (Runs every minute)
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const postsToPublish = scheduledPosts.filter(p => new Date(p.scheduledAt) <= now && p.status === "scheduled");

  for (const post of postsToPublish) {
    console.log(`Publishing post ${post.id} to ${post.platforms.join(", ")}`);
    try {
      // Real API call to social platform would go here
      // await axios.post(platformUrl, { content: post.content }, { headers: { Authorization: `Bearer ${decrypt(post.token)}` } });
      
      post.status = "published";
      post.publishedAt = new Date().toISOString();
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error);
      post.status = "failed";
      post.failureReason = "API Error";
    }
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
