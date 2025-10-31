  -- ============================================================================
  -- HUSIG LEAD MANAGEMENT PLATFORM - SIMPLIFIED SCHEMA
  -- No complex user management, just basic Supabase auth
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
  DROP FUNCTION IF EXISTS public.reject_user(UUID) CASCADE;
  DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
  DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
  DROP FUNCTION IF EXISTS log_lead_status_change() CASCADE;
  DROP FUNCTION IF EXISTS log_lead_creation() CASCADE;
  DROP FUNCTION IF EXISTS log_note_added() CASCADE;
  DROP FUNCTION IF EXISTS log_lead_update() CASCADE;

  -- ============================================================================
  -- SIMPLE PROFILES TABLE
  -- ============================================================================

  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ============================================================================
  -- LEADS TABLE
  -- ============================================================================

  CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    job_title TEXT DEFAULT 'Not Specified',
    seniority_level TEXT DEFAULT 'Individual Contributor',
    linkedin_url TEXT,
    
    -- Company Information
    company_name TEXT NOT NULL,
    company_website TEXT,
    company_size TEXT DEFAULT '1-10',
    industry TEXT DEFAULT 'Other',
    
    -- Project Information
    service_interest TEXT[] DEFAULT ARRAY['Not Sure Yet'],
    pain_point TEXT DEFAULT 'Not specified',
    project_timeline TEXT DEFAULT 'Flexible',
    budget_range TEXT,
    
    -- Lead Management
    lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'archived')),
    lead_score INTEGER DEFAULT 0,
    lead_source TEXT DEFAULT 'Other',
    tags TEXT[],
    notes TEXT,
    
    -- System fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ============================================================================
  -- ACTIVITIES TABLE
  -- ============================================================================

  CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('status_changed', 'note_added', 'lead_created', 'lead_updated', 'email_sent', 'call_made', 'meeting_scheduled')),
    description TEXT NOT NULL,
    metadata JSONB,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ============================================================================
  -- NOTES TABLE
  -- ============================================================================

  CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'follow_up')),
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ============================================================================
  -- INDEXES FOR PERFORMANCE
  -- ============================================================================

  CREATE INDEX idx_profiles_email ON profiles(email);
  CREATE INDEX idx_leads_email ON leads(email);
  CREATE INDEX idx_leads_company_name ON leads(company_name);
  CREATE INDEX idx_leads_status ON leads(lead_status);
  CREATE INDEX idx_leads_score ON leads(lead_score DESC);
  CREATE INDEX idx_leads_created_by ON leads(created_by);
  CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
  CREATE INDEX idx_activities_lead_id ON activities(lead_id);
  CREATE INDEX idx_activities_type ON activities(activity_type);
  CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
  CREATE INDEX idx_notes_lead_id ON notes(lead_id);
  CREATE INDEX idx_notes_created_by ON notes(created_by);
  CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

  -- ============================================================================
  -- SIMPLE FUNCTIONS
  -- ============================================================================

  -- Function: Update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Simple function: Create profile on signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email
    );
    RETURN NEW;
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

  -- ============================================================================
  -- SIMPLE RLS POLICIES
  -- ============================================================================

  -- Enable RLS on all tables
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

  -- SIMPLE POLICIES: All authenticated users can access everything
  CREATE POLICY "authenticated_all_profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');
  CREATE POLICY "authenticated_all_leads" ON leads FOR ALL USING (auth.role() = 'authenticated');
  CREATE POLICY "authenticated_all_activities" ON activities FOR ALL USING (auth.role() = 'authenticated');
  CREATE POLICY "authenticated_all_notes" ON notes FOR ALL USING (auth.role() = 'authenticated');

  -- Insert policies with created_by check
  CREATE POLICY "authenticated_insert_leads" ON leads FOR INSERT WITH CHECK (auth.uid() = created_by);
  CREATE POLICY "authenticated_insert_activities" ON activities FOR INSERT WITH CHECK (auth.uid() = created_by);
  CREATE POLICY "authenticated_insert_notes" ON notes FOR INSERT WITH CHECK (auth.uid() = created_by);

  -- ============================================================================
  -- TRIGGERS
  -- ============================================================================

  -- Create profile on user signup
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

  -- Update updated_at timestamps
  CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Activity logging
  CREATE TRIGGER lead_status_change_trigger
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

  CREATE TRIGGER lead_creation_trigger
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_creation();

  CREATE TRIGGER note_added_trigger
    AFTER INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION log_note_added();

  -- ============================================================================
  -- SECURITY
  -- ============================================================================

  -- Grant necessary permissions
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;