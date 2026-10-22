import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or current folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Gemini AI
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),

  // YouTube Data API v3 (for official music search)
  YOUTUBE_API_KEY: z.string().optional(),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'SUPABASE_PUBLISHABLE_KEY is required'),
  SUPABASE_SECRET_KEY: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // MCP Server
  MCP_SERVER_NAME: z.string().default('Alexa+ Smart Assistant MCP Server'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  MCP_ENDPOINT_PATH: z.string().default('/mcp'),

  // OAuth 2.1 for Alexa+ Add-on Integration
  OAUTH_ISSUER_URL: z.string().default('http://localhost:4000'),
  OAUTH_CLIENT_ID: z.string().default('alexa-plus-client'),
  OAUTH_CLIENT_SECRET: z.string().default('alexa-plus-secret-key-change-in-production'),
  OAUTH_REDIRECT_URI: z.string().default('https://pitangui.amazon.com/api/skill/link/prototype'),
});

export type Config = z.infer<typeof configSchema>;

let parsedConfig: Config;
try {
  parsedConfig = configSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Configuration validation failed:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('❌ Failed to parse environment variables:', error);
  }
  process.exit(1);
}

export const config = parsedConfig;
