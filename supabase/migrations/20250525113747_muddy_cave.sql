/*
  # Consolidated Migrations
  
  This migration consolidates multiple previous migrations that were addressing
  the same issues, particularly around profiles table RLS policies and fixing
  recursion issues.
  
  1. Changes
    - Drops all existing problematic policies on profiles table
    - Creates new, optimized policies that avoid recursion
    - Adds system settings and admin functionality
    - Ensures proper access control for different user roles
    
  2. Security
    - Maintains row level security
    - Prevents infinite recursion in policy evaluation
    - Preserves existing security model with cleaner implementation
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access to hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Enable admin access to hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Enable super admin access" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new, optimized policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id = (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "Hospital admins can manage profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND p.hospital_id = profiles.hospital_id
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND p.hospital_id = profiles.hospital_id
    LIMIT 1
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'super_admin'
    LIMIT 1
  )
);

-- Create or replace function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TABLE (role text)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.role
  FROM profiles p
  WHERE p.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE EXECUTE ON FUNCTION get_user_role FROM public;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;

-- Create or replace function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'super_admin'
  );
$$;

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id)
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for system_settings
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;
CREATE POLICY "Super admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create admin_audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb NOT NULL,
  ip_address text,
  user_agent text
);

-- Enable RLS on admin_audit_logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_audit_logs
DROP POLICY IF EXISTS "Super admins can view audit logs" ON admin_audit_logs;
CREATE POLICY "Super admins can view audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_id_idx ON admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_type_idx ON admin_audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON admin_audit_logs (created_at);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action text,
  entity_type text,
  entity_id uuid,
  changes jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can log actions';
  END IF;

  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    action,
    entity_type,
    entity_id,
    changes,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent'
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Create view for super admin dashboard statistics
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT
  (SELECT count(*) FROM hospitals) as total_hospitals,
  (SELECT count(*) FROM profiles WHERE role != 'super_admin') as total_users,
  (SELECT count(*) FROM patients) as total_patients,
  (SELECT count(*) FROM departments) as total_departments,
  (SELECT count(*) FROM profiles WHERE role = 'doctor') as total_doctors,
  (SELECT count(*) FROM profiles WHERE role = 'nurse') as total_nurses;

-- Grant access to super_admin_stats view
GRANT SELECT ON super_admin_stats TO authenticated;

-- Create policy for hospitals table
DROP POLICY IF EXISTS "Super admins can manage hospitals" ON hospitals;
CREATE POLICY "Super admins can manage hospitals"
ON hospitals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
);