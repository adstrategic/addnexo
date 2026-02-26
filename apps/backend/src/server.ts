import "dotenv/config";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "./core/auth.js";
import { envVars } from "./core/envVars.js";

const app = express();
const port = Number(envVars.PORT);

const frontendOrigin = envVars.FRONTEND_URL;

app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: [frontendOrigin],
  }),
);

// Better Auth handler – must be before express.json() (Express 5: use *splat)
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

/**
 * Example protected route: get current session.
 * Use auth.api.getSession({ headers: fromNodeHeaders(req.headers) }) in any route
 * that requires an authenticated user. Use session.activeOrganizationId for tenant scope.
 */
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({
    session: {
      activeOrganizationId: session.session.activeOrganizationId ?? null,
      id: session.session.id,
    },
    user: session.user,
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${envVars.PORT}`);
  console.log(`Auth: http://localhost:${envVars.PORT}/api/auth`);
});
