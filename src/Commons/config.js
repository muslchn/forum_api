/* istanbul ignore file */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  const testEnvPath = path.resolve(process.cwd(), '.test.env');
  // Only try to load .test.env if it exists (local testing)
  // In CI, environment variables are set directly
  if (fs.existsSync(testEnvPath)) {
    dotenv.config({ path: testEnvPath });
  }
} else {
  dotenv.config();
}

// Function to parse DATABASE_URL if individual PG variables are not set
// This is useful for CI/CD environments that provide DATABASE_URL
function getDatabaseConfig() {
  // If DATABASE_URL is provided, parse it
  if (process.env.DATABASE_URL && !process.env.PGHOST) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading '/'
      };
    } catch {
      // Fall through to use individual variables
    }
  }

  // Use individual PG variables (local development)
  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };
}

const config = {
  app: {
    host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    port: process.env.PORT,
    debug: process.env.NODE_ENV === 'development' ? { request: ['error'] } : {},
  },
  database: getDatabaseConfig(),
  auth: {
    jwtStrategy: 'forumapi',
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    accessTokenAge: process.env.ACCESS_TOKEN_AGE,
  },
};

export default config;
