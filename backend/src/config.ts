import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or current folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  FRONTEND_URL: z.string().default('https://alexa-smart-assistant.vercel.app'),

  // Gemini AI
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),

  // YouTube Data API v3 (for official music search)
  YOUTUBE_API_KEY: z.string().default(''),

  // Supabase
  SUPABASE_URL: z.string().default('https://qlwzprsqudhzqzxyzmyf.supabase.co'),
  SUPABASE_PUBLISHABLE_KEY: z.string().default('sb_publishable_Kt2zjmH9zSjU13qS8nqn6Q_SLcOuob8'),
  SUPABASE_SECRET_KEY: z.string().optional(),
  DATABASE_URL: z.string().default('postgresql://postgres.qlwzprsqudhzqzxyzmyf:9608300407Sid@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'),

  // MCP Server
  MCP_SERVER_NAME: z.string().default('Alexa+ Smart Assistant MCP Server'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  MCP_ENDPOINT_PATH: z.string().default('/mcp'),

  // OAuth 2.1 for Alexa+ Add-on Integration
  OAUTH_ISSUER_URL: z.string().default('https://alexa-smart-assistant.onrender.com'),
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
    console.warn('⚠️ Configuration validation warning:');
    error.errors.forEach(err => {
      console.warn(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.warn('⚠️ Failed to parse environment variables:', error);
  }
  // Safe fallback to defaults rather than crashing the container
  parsedConfig = configSchema.parse({});
}

export const config = parsedConfig;
