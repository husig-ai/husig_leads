-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'intern')) DEFAULT 'intern',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  job_title TEXT NOT NULL,
  seniority_level TEXT CHECK (seniority_level IN ('C-Level', 'VP/Director', 'Manager', 'Individual Contributor')),
  linkedin_url TEXT,
  company_name TEXT NOT NULL,
  company_website TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  industry TEXT CHECK (industry IN ('Financial Services', 'Healthcare', 'Government/Public Sector', 'E-commerce', 'Transportation', 'Education', 'Manufacturing', 'Other')),
  service_interest TEXT[] NOT NULL,
  pain_point TEXT NOT NULL,
  project_timeline TEXT CHECK (project_timeline IN ('ASAP', '1-3 months', '3-6 months', '6-12 months', 'Flexible')),
  budget_range TEXT CHECK (budget_range IN ('<$10K', '$10K-$50K', '$50K-$100K', '$100K-$250K', '$250K+', 'Not Sure')),
  lead_source TEXT CHECK (lead_source IN ('LinkedIn', 'Google Search', 'Referral', 'Cold Outreach', 'Other')),
  lead_status TEXT CHECK (lead_status IN ('New', 'Contacted', 'Qualified', 'Demo Scheduled', 'Proposal Sent', 'Won', 'Lost')) DEFAULT 'New',
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_score ON leads(lead_score);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leads table
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Leads RLS Policies
CREATE POLICY "Users can view their own leads or all if admin/manager"
  ON leads FOR SELECT
  USING (
    auth.uid() = created_by 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own leads or all if admin/manager"
  ON leads FOR UPDATE
  USING (
    auth.uid() = created_by 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins can delete leads"
  ON leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'intern'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();