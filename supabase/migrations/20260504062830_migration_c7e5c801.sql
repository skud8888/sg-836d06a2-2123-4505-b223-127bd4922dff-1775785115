-- Drop existing view if it exists
DROP VIEW IF EXISTS public.user_management;

-- Create user_management view using valid columns
CREATE OR REPLACE VIEW public.user_management AS
SELECT 
    u.id,
    u.email,
    u.created_at as joined_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.confirmed_at,
    p.full_name,
    p.avatar_url,
    COALESCE((SELECT role FROM public.user_roles WHERE user_id = u.id LIMIT 1), 'student') as primary_role,
    COALESCE(
        (SELECT array_agg(role) FROM public.user_roles WHERE user_id = u.id), 
        ARRAY[]::text[]
    ) as user_roles
FROM 
    auth.users u
LEFT JOIN 
    public.profiles p ON p.id = u.id
ORDER BY 
    u.created_at DESC;

-- Grant permissions to view
GRANT SELECT ON public.user_management TO authenticated;
GRANT SELECT ON public.user_management TO anon;

-- Create RLS policy for the view
ALTER VIEW public.user_management SET (security_invoker = on);

-- Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';