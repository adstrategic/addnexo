const requiredEnvVars = [
  "PORT",
  "FRONTEND_URL",
  // "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
] as const;

function getEnvVars(): Record<(typeof requiredEnvVars)[number], string> {
  const missing = requiredEnvVars.filter(
    (key) => process.env[key] === undefined || process.env[key] === "",
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
  if (
    !process.env.BETTER_AUTH_SECRET ||
    // !process.env.BETTER_AUTH_URL ||
    !process.env.DATABASE_URL ||
    !process.env.FRONTEND_URL ||
    !process.env.PORT
  ) {
    throw new Error("Missing required environment variables");
  }
  return {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    // BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    PORT: process.env.PORT,
  };
}

export const envVars = getEnvVars();
