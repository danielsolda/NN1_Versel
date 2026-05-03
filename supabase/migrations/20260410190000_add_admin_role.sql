-- Add admin role for the management dashboard.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';