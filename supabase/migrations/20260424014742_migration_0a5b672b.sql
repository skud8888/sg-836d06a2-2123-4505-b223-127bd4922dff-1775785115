-- Create essential tables for GTSTrain Production
-- Starting with core authentication and user management tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'trainer', 'student', 'field_officer')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_new_booking BOOLEAN DEFAULT true,
    email_payment_received BOOLEAN DEFAULT true,
    email_new_enquiry BOOLEAN DEFAULT true,
    sms_new_booking BOOLEAN DEFAULT false,
    daily_digest BOOLEAN DEFAULT false,
    digest_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON user_roles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    )
);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Essential tables created successfully' as status;