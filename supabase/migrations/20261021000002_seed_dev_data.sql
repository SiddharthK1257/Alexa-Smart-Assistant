-- Supabase Migration: 20261021000002_seed_dev_data.sql
-- Development Seed Data for Alexa+ Smart Assistant

DO $$
DECLARE
  demo_user_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Insert or update demo user into auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alexa.demo@example.com' OR id = demo_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      demo_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'alexa.demo@example.com',
      crypt('AlexaDemo2026!', gen_salt('bf', 10)),
      NOW(),
      '',
      '',
      '',
      '',
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Alexa Demo User", "display_name": "Alexa Demo User"}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('AlexaDemo2026!', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      updated_at = NOW()
    WHERE id = demo_user_id OR email = 'alexa.demo@example.com';
  END IF;

  -- Ensure auth.identities has matching entry for GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    demo_user_id,
    demo_user_id,
    json_build_object('sub', demo_user_id::text, 'email', 'alexa.demo@example.com'),
    'email',
    demo_user_id::text,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, display_name, email, preferences)
  VALUES (
    demo_user_id,
    'Alexa Demo User',
    'alexa.demo@example.com',
    '{"voice_muted": false, "speech_rate": 1.0, "theme": "alexa_dark"}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      email = EXCLUDED.email;

  -- Seed Tasks
  INSERT INTO public.tasks (id, user_id, title, description, priority, status, due_date)
  VALUES 
    (
      'b0000000-0000-0000-0000-000000000001'::uuid,
      demo_user_id,
      'Review Alexa+ Architecture & MCP Integration Specs',
      'Verify Streamable HTTP transport and Supabase RLS security policies.',
      'high',
      'in_progress',
      NOW() + INTERVAL '1 day'
    ),
    (
      'b0000000-0000-0000-0000-000000000002'::uuid,
      demo_user_id,
      'Order groceries for dinner party',
      'Almond milk, avocados, whole wheat sourdough, and organic olive oil.',
      'medium',
      'pending',
      NOW() + INTERVAL '2 days'
    ),
    (
      'b0000000-0000-0000-0000-000000000003'::uuid,
      demo_user_id,
      'Complete Vitest and Supertest automated test suite',
      'Ensure 100% test pass rate across auth, tools, RLS, and Gemini fallback.',
      'urgent',
      'completed',
      NOW() - INTERVAL '2 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Seed Reminders
  INSERT INTO public.reminders (id, user_id, message, scheduled_time, status)
  VALUES
    (
      'c0000000-0000-0000-0000-000000000001'::uuid,
      demo_user_id,
      'Daily standup meeting with AI Engineering team',
      NOW() + INTERVAL '30 minutes',
      'scheduled'
    ),
    (
      'c0000000-0000-0000-0000-000000000002'::uuid,
      demo_user_id,
      'Drink water and stretch posture',
      NOW() + INTERVAL '2 hours',
      'scheduled'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Seed Notes
  INSERT INTO public.notes (id, user_id, title, content, tags)
  VALUES
    (
      'd0000000-0000-0000-0000-000000000001'::uuid,
      demo_user_id,
      'Alexa+ MCP Toolkit Notes',
      'MCP endpoint must support Streamable HTTP with JSON-RPC 2.0 messages. OAuth 2.1 authorization code flow with PKCE is used for account linking.',
      ARRAY['alexa', 'mcp', 'architecture']
    ),
    (
      'd0000000-0000-0000-0000-000000000002'::uuid,
      demo_user_id,
      'Project Guidelines & Security Checklist',
      'Row Level Security enabled on all tables. Never trust user ID from model; derive strictly from validated Supabase auth token.',
      ARRAY['security', 'supabase', 'guidelines']
    )
  ON CONFLICT (id) DO NOTHING;

  -- Seed Initial Audit Log
  INSERT INTO public.audit_events (id, user_id, event_type, tool_name, status, details)
  VALUES (
    'e0000000-0000-0000-0000-000000000001'::uuid,
    demo_user_id,
    'system_seed',
    'migration_runner',
    'success',
    '{"message": "Development seed data loaded successfully"}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
