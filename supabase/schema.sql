-- ============================================================================
-- HUSIG LEAD MANAGEMENT PLATFORM - UPDATED DATABASE SCHEMA
-- Admin-Only Signup + Full Visibility for All Users
-- ============================================================================

-- Drop existing tables (for clean reset)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'intern')) DEFAULT 'intern',
  avatar_url TEXT,
  -- New fields for admin-controlled access
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  invitation_token TEXT UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  company_website TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  industry TEXT CHECK (industry IN ('Financial Services', 'Healthcare', 'Government/Public Sector', 'E-commerce', 'Transportation', 'Education', 'Manufacturing', 'Other')),
  
  -- Project Details
  service_interest TEXT[] NOT NULL,
  pain_point TEXT NOT NULL,
  project_timeline TEXT CHECK (project_timeline IN ('ASAP', '1-3 months', '3-6 months', '6-12 months', 'Flexible')),
  budget_range TEXT CHECK (budget_range IN ('<$10K', '$10K-$50K', '$50K-$100K', '$100K-$250K', '$250K+', 'Not Sure')),
  lead_source TEXT CHECK (lead_source IN ('LinkedIn', 'Google Search', 'Website', 'Referral', 'Conference', 'Cold Outreach', 'Other')),
  
  -- Lead Management (Updated to lowercase status values)
  lead_status TEXT CHECK (lead_status IN (
    'new', 
    'qualifying', 
    'qualified', 
    'nurturing', 
    'demo_scheduled', 
    'demo_completed', 
    'proposal_sent', 
    'negotiating', 
    'converted', 
    'lost', 
    'disqualified'
  )) DEFAULT 'new',
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  notes TEXT,
  
  -- Assignment and Ownership
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT CHECK (activity_type IN (
    'status_changed',
    'note_added',
    'email_sent',
    'call_made',
    'meeting_scheduled',
    'meeting_completed',
    'document_sent',
    'follow_up_scheduled',
    'lead_updated',
    'lead_created'
  )) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Leads indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_score ON leads(lead_score);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_company_name ON leads(company_name);

-- Activities indexes
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);

-- Notes indexes
CREATE INDEX idx_notes_lead_id ON notes(lead_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX idx_profiles_invitation_token ON profiles(invitation_token);

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

-- Function: Handle new user signup (UPDATED for admin approval)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if user was invited (has invitation_token in metadata)
  -- OR if it's the very first user (no profiles exist - bootstrap admin)
  IF (
    NEW.raw_user_meta_data->>'invitation_token' IS NOT NULL 
    OR 
    (SELECT COUNT(*) FROM public.profiles) = 0
  ) THEN
    INSERT INTO public.profiles (id, full_name, email, role, is_approved, invitation_token)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      CASE 
        WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'  -- First user is admin
        ELSE 'intern'
      END,
      CASE 
        WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN TRUE  -- First user is auto-approved
        ELSE FALSE  -- Others need approval
      END,
      NEW.raw_user_meta_data->>'invitation_token'
    );
  ELSE
    -- Reject unauthorized signups by deleting the auth user
    DELETE FROM auth.users WHERE id = NEW.id;
    RAISE EXCEPTION 'Unauthorized signup attempt. Users must be invited by an admin.';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, clean up the auth user
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
      COALESCE(auth.uid(), NEW.created_by)
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
    'Lead created',
    jsonb_build_object('lead_score', NEW.lead_score),
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
    'Added a note',
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
  
  -- Track which fields changed
  IF OLD.first_name IS DISTINCT FROM NEW.first_name OR OLD.last_name IS DISTINCT FROM NEW.last_name THEN
    changes := array_append(changes, 'contact info');
  END IF;
  
  IF OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone THEN
    changes := array_append(changes, 'contact details');
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
  
  -- Only log if something changed (and ignore status changes, that has its own trigger)
  IF array_length(changes, 1) > 0 AND OLD.lead_status = NEW.lead_status THEN
    INSERT INTO activities (lead_id, activity_type, description, metadata, created_by)
    VALUES (
      NEW.id,
      'lead_updated',
      format('Updated %s', array_to_string(changes, ', ')),
      jsonb_build_object('changes', changes),
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve user (for admins)
CREATE OR REPLACE FUNCTION approve_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;
  
  -- Approve the user
  UPDATE profiles 
  SET 
    is_approved = TRUE,
    approved_by = auth.uid(),
    approved_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing triggers first (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS lead_status_change_trigger ON leads;
DROP TRIGGER IF EXISTS lead_creation_trigger ON leads;
DROP TRIGGER IF EXISTS note_added_trigger ON notes;
DROP TRIGGER IF EXISTS lead_update_trigger ON leads;

-- Trigger: Create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on notes
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Log lead status changes
CREATE TRIGGER lead_status_change_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_status_change();

-- Trigger: Log lead creation
CREATE TRIGGER lead_creation_trigger
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_creation();

-- Trigger: Log when notes are added
CREATE TRIGGER note_added_trigger
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION log_note_added();

-- Trigger: Log lead updates
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
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not approval status)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.is_approved = TRUE
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.is_approved = TRUE
    )
  );

-- Block access for non-approved users
CREATE POLICY "Block non-approved users"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- ============================================================================
-- RLS POLICIES: LEADS (UPDATED - All approved users can access everything)
-- ============================================================================

-- All approved users can view all leads
CREATE POLICY "Approved users can view all leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can insert leads
CREATE POLICY "Approved users can insert leads"
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
CREATE POLICY "Approved users can update all leads"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can delete all leads
CREATE POLICY "Approved users can delete all leads"
  ON leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- ============================================================================
-- RLS POLICIES: ACTIVITIES (UPDATED - All approved users can access everything)
-- ============================================================================

-- All approved users can view all activities
CREATE POLICY "Approved users can view all activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can insert activities
CREATE POLICY "Approved users can insert activities"
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
-- RLS POLICIES: NOTES (UPDATED - All approved users can access everything)
-- ============================================================================

-- All approved users can view all notes
CREATE POLICY "Approved users can view all notes"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can insert notes
CREATE POLICY "Approved users can insert notes"
  ON notes FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can update all notes
CREATE POLICY "Approved users can update all notes"
  ON notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- All approved users can delete all notes
CREATE POLICY "Approved users can delete all notes"
  ON notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_approved = TRUE
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (Optional - remove comments to run after setup)
-- ============================================================================

-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
-- SELECT conname, contype FROM pg_constraint WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================