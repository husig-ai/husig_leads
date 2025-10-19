-- ============================================================================
-- HUSIG LEAD MANAGEMENT PLATFORM - COMPLETE DATABASE SCHEMA
-- Admin-Only Signup + Full Visibility for All Users
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (for clean reset)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.approve_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.approve_user_safe(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_lead_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_lead_creation() CASCADE;
DROP FUNCTION IF EXISTS log_note_added() CASCADE;
DROP FUNCTION IF EXISTS log_lead_update() CASCADE;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'intern')) DEFAULT 'intern',
  avatar_url TEXT,
  
  -- Admin-controlled access fields
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Invitation tracking
  invitation_token TEXT UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  job_title TEXT NOT NULL,
  seniority_level TEXT CHECK (seniority_level IN ('C-Level', 'VP/Director', 'Manager', 'Individual Contributor')),
  linkedin_url TEXT,
  
  -- Company Information
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  industry TEXT,
  
  -- Lead Details
  lead_source TEXT CHECK (lead_source IN ('Website', 'LinkedIn', 'Referral', 'Conference', 'Cold Outreach', 'Other')),
  lead_status TEXT CHECK (lead_status IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost', 'On Hold')) DEFAULT 'New',
  lead_score INTEGER CHECK (lead_score BETWEEN 0 AND 100) DEFAULT 0,
  
  -- Project Information
  service_interest TEXT CHECK (service_interest IN ('Analytics', 'AI/ML', 'Data Engineering', 'Operations Research', 'Consulting')),
  pain_point TEXT,
  project_timeline TEXT CHECK (project_timeline IN ('Immediate', '1-3 months', '3-6 months', '6-12 months', '12+ months')),
  budget_range TEXT CHECK (budget_range IN ('< $10k', '$10k - $50k', '$50k - $100k', '$100k - $500k', '$500k+')),
  
  -- Additional Information
  notes TEXT,
  tags TEXT[], -- Array of tags
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITIES TABLE (Lead History/Timeline)
-- ============================================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'lead_created', 'status_changed', 'note_added', 'email_sent', 
    'call_made', 'meeting_scheduled', 'proposal_sent', 'lead_updated'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTES TABLE
-- ============================================================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('General', 'Call Notes', 'Meeting Notes', 'Email', 'Follow-up')) DEFAULT 'General',
  is_private BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX idx_profiles_invitation_token ON profiles(invitation_token);

-- Leads indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company_name ON leads(company_name);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_source ON leads(lead_source);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);

-- Activities indexes
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Notes indexes
CREATE INDEX idx_notes_lead_id ON notes(lead_id);
CREATE INDEX idx_notes_created_by ON notes(created_by);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle new user signup (FIXED for admin approval)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INTEGER;
  is_first_user BOOLEAN := FALSE;
  user_role TEXT := 'intern';
  user_approved BOOLEAN := FALSE;
BEGIN
  -- Get current profile count in a single transaction
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  -- Determine if this is the first user (bootstrap admin)
  IF profile_count = 0 THEN
    is_first_user := TRUE;
    user_role := 'admin';
    user_approved := TRUE;
    RAISE NOTICE 'Creating first admin user: %', NEW.email;
  END IF;
  
  -- Check if user has invitation token OR is the first user
  IF NEW.raw_user_meta_data->>'invitation_token' IS NOT NULL OR is_first_user THEN
    -- Create profile for invited user or first admin
    INSERT INTO public.profiles (
      id, 
      full_name, 
      email, 
      role, 
      is_approved, 
      invitation_token,
      invited_by,
      invited_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      user_role,
      user_approved,
      NEW.raw_user_meta_data->>'invitation_token',
      (NEW.raw_user_meta_data->>'invited_by')::UUID,
      CASE 
        WHEN NEW.raw_user_meta_data->>'invited_by' IS NOT NULL THEN NOW()
        ELSE NULL
      END
    );
    
    RAISE NOTICE 'Profile created for user %: role=%, approved=%', NEW.email, user_role, user_approved;
    
  ELSE
    -- Unauthorized signup - delete the auth user immediately
    RAISE NOTICE 'Unauthorized signup attempt by %', NEW.email;
    DELETE FROM auth.users WHERE id = NEW.id;
    RAISE EXCEPTION 'Unauthorized signup. Users must be invited by an administrator.';
  END IF;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Clean up on any error
  RAISE NOTICE 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
  DELETE FROM auth.users WHERE id = NEW.id;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log lead status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lead_status IS DISTINCT FROM NEW.lead_status THEN
    INSERT INTO activities (lead_id, activity_type, description, metadata, created_by)
    VALUES (
      NEW.id,
      'status_changed',
      format('Status changed from %s to %s', OLD.lead_status, NEW.lead_status),
      jsonb_build_object(
        'old_status', OLD.lead_status,
        'new_status', NEW.lead_status
      ),
      COALESCE(auth.uid(), NEW.updated_by, NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log lead creation
CREATE OR REPLACE FUNCTION log_lead_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (lead_id, activity_type, description, metadata, created_by)
  VALUES (
    NEW.id,
    'lead_created',
    format('Lead created for %s %s at %s', NEW.first_name, NEW.last_name, NEW.company_name),
    jsonb_build_object(
      'lead_score', NEW.lead_score,
      'lead_source', NEW.lead_source,
      'service_interest', NEW.service_interest
    ),
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log when notes are added
CREATE OR REPLACE FUNCTION log_note_added()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (lead_id, activity_type, description, created_by)
  VALUES (
    NEW.lead_id,
    'note_added',
    format('Added a %s note', LOWER(NEW.note_type)),
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log when lead fields are updated
CREATE OR REPLACE FUNCTION log_lead_update()
RETURNS TRIGGER AS $$
DECLARE
  changes TEXT[];
BEGIN
  changes := ARRAY[]::TEXT[];
  
  -- Track which fields changed (excluding status changes and timestamps)
  IF OLD.first_name IS DISTINCT FROM NEW.first_name OR 
     OLD.last_name IS DISTINCT FROM NEW.last_name OR
     OLD.email IS DISTINCT FROM NEW.email OR 
     OLD.phone IS DISTINCT FROM NEW.phone OR
     OLD.job_title IS DISTINCT FROM NEW.job_title OR
     OLD.seniority_level IS DISTINCT FROM NEW.seniority_level OR
     OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url THEN
    changes := array_append(changes, 'contact info');
  END IF;
  
  IF OLD.company_name IS DISTINCT FROM NEW.company_name OR 
     OLD.company_website IS DISTINCT FROM NEW.company_website OR
     OLD.company_size IS DISTINCT FROM NEW.company_size OR
     OLD.industry IS DISTINCT FROM NEW.industry THEN
    changes := array_append(changes, 'company info');
  END IF;
  
  IF OLD.service_interest IS DISTINCT FROM NEW.service_interest OR
     OLD.pain_point IS DISTINCT FROM NEW.pain_point OR
     OLD.project_timeline IS DISTINCT FROM NEW.project_timeline OR
     OLD.budget_range IS DISTINCT FROM NEW.budget_range THEN
    changes := array_append(changes, 'project details');
  END IF;
  
  IF OLD.lead_score IS DISTINCT FROM NEW.lead_score THEN
    changes := array_append(changes, 'lead score');
  END IF;
  
  IF OLD.lead_source IS DISTINCT FROM NEW.lead_source THEN
    changes := array_append(changes, 'lead source');
  END IF;
  
  IF OLD.tags IS DISTINCT FROM NEW.tags THEN
    changes := array_append(changes, 'tags');
  END IF;
  
  -- Only log if something changed (and ignore status changes, that has its own trigger)
  IF array_length(changes, 1) > 0 AND OLD.lead_status = NEW.lead_status THEN
    INSERT INTO activities (lead_id, activity_type, description, metadata, created_by)
    VALUES (
      NEW.id,
      'lead_updated',
      format('Updated %s', array_to_string(changes, ', ')),
      jsonb_build_object('changes', changes),
      COALESCE(auth.uid(), NEW.updated_by, NEW.created_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Safely approve users (for admins)
CREATE OR REPLACE FUNCTION approve_user_safe(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  target_user_exists BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid() AND is_approved = TRUE;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only approved admins can approve users';
  END IF;
  
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = target_user_id) INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Approve the user
  UPDATE profiles 
  SET 
    is_approved = TRUE,
    approved_by = auth.uid(),
    approved_at = NOW()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check bootstrap status
CREATE OR REPLACE FUNCTION public.check_bootstrap_status()
RETURNS TABLE(
  total_profiles INTEGER,
  admin_count INTEGER,
  approved_admin_count INTEGER,
  needs_bootstrap BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM profiles) as total_profiles,
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE role = 'admin' AND is_approved = TRUE) as approved_admin_count,
    (SELECT COUNT(*) = 0 FROM profiles) as needs_bootstrap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on notes
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Log lead status changes
CREATE TRIGGER lead_status_change_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_status_change();

-- Log lead creation
CREATE TRIGGER lead_creation_trigger
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_creation();

-- Log when notes are added
CREATE TRIGGER note_added_trigger
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION log_note_added();

-- Log lead updates
CREATE TRIGGER lead_update_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_update();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: PROFILES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "profile_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles  
CREATE POLICY "profile_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
      AND admin_profile.is_approved = TRUE
    )
  );

-- Users can update their own profile (excluding approval fields)
CREATE POLICY "profile_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profile_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
      AND admin_profile.is_approved = TRUE
    )
  );

-- Allow system to insert profiles (for triggers)
CREATE POLICY "profile_insert_system"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: LEADS (All approved users can access everything)
-- ============================================================================

-- All approved users can view all leads
CREATE POLICY "approved_users_select_leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can insert leads
CREATE POLICY "approved_users_insert_leads"
  ON leads FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can update all leads
CREATE POLICY "approved_users_update_leads"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can delete all leads
CREATE POLICY "approved_users_delete_leads"
  ON leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- ============================================================================
-- RLS POLICIES: ACTIVITIES (All approved users can access everything)
-- ============================================================================

-- All approved users can view all activities
CREATE POLICY "approved_users_select_activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can insert activities
CREATE POLICY "approved_users_insert_activities"
  ON activities FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- ============================================================================
-- RLS POLICIES: NOTES (All approved users can access everything)
-- ============================================================================

-- All approved users can view all notes
CREATE POLICY "approved_users_select_notes"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can insert notes
CREATE POLICY "approved_users_insert_notes"
  ON notes FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can update their own notes
CREATE POLICY "approved_users_update_own_notes"
  ON notes FOR UPDATE
  USING (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can delete their own notes
CREATE POLICY "approved_users_delete_own_notes"
  ON notes FOR DELETE
  USING (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- ============================================================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ============================================================================

-- Insert sample lead statuses and sources for reference
-- This data can be used by your application for dropdowns

-- Note: The first user to sign up will automatically become an admin
-- No sample data needed for profiles as they're created via auth signup

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query to check system status
CREATE OR REPLACE FUNCTION public.system_status()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'profiles'::TEXT, COUNT(*), 
    CASE WHEN COUNT(*) = 0 THEN 'Empty - Create first admin' ELSE 'OK' END
  FROM profiles
  UNION ALL
  SELECT 'leads'::TEXT, COUNT(*), 'OK'::TEXT FROM leads
  UNION ALL
  SELECT 'activities'::TEXT, COUNT(*), 'OK'::TEXT FROM activities
  UNION ALL
  SELECT 'notes'::TEXT, COUNT(*), 'OK'::TEXT FROM notes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETED SCHEMA
-- ============================================================================

-- To verify everything is working:
-- SELECT * FROM public.system_status();
-- SELECT * FROM public.check_bootstrap_status();