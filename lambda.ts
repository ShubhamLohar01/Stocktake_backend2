import "dotenv/config";

// Construct DATABASE_URL from individual DB variables if DATABASE_URL doesn't exist
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const dbUser = process.env.DB_USER || process.env.DB_USERNAME || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "";
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || "5432";
  const dbName = process.env.DB_NAME || process.env.DB_DATABASE || "postgres";
  const dbSchema = process.env.DB_SCHEMA || "public";
  
  // Construct PostgreSQL connection string
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=${dbSchema}`;
}

import serverless from "serverless-http";
import { createServer } from "./index.js";

// Create the Express app
const app = createServer();

// Export the handler for Lambda
// This wraps the Express app to work with AWS Lambda
export const handler = serverless(app, {
  binary: [
    'image/*',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/pdf'
  ],
});
