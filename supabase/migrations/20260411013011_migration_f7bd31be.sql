-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create a security definer function to check user role without RLS recursion
CREATE OR REPLACE FUNCTION check_user_role(check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = check_role
  );
END;
$$;

-- Create a security definer function to check if user has any admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  );
END;
$$;

-- Recreate policies using the helper functions
CREATE POLICY "Super admins can manage all roles"
ON user_roles
FOR ALL
TO public
USING (check_user_role('super_admin'));

CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO public
USING (auth.uid() = user_id);