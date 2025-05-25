/*
  # Hospital Management System Schema

  1. New Tables
    - `hospitals` - Stores hospital information
    - `departments` - Departments within hospitals
    - `profiles` - User profiles with roles
    - `patients` - Patient records
    - `appointments` - Patient appointments
    - `consultations` - Doctor consultations
    - `triage` - Triage records
    - `vital_signs` - Patient vital signs
    - `lab_results` - Laboratory test results
    - `radiology_results` - Radiology scan results
    - `pharmacy` - Pharmacy orders
    - `billing` - Billing records
    - `inpatients` - Inpatient records
    - `allergies` - Patient allergies
    - `immunizations` - Patient immunizations
    - `medical_history` - Patient medical history
    - `documents` - Medical documents
    - `care_plans` - Patient care plans
    - `referrals` - Patient referrals
    - `support_tickets` - Support tickets
    - `system_modules` - System modules
    - `pricing_plans` - Pricing plans
    - `licenses` - Hospital licenses
    - `clinical_protocols` - Clinical protocols
    - `clinical_settings` - Clinical settings
    - `system_settings` - System settings
    - `billing_settings` - Billing settings
    - `support_settings` - Support settings
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  logo_url TEXT,
  patient_id_format TEXT DEFAULT 'prefix_number',
  patient_id_prefix TEXT DEFAULT 'PT',
  patient_id_digits INTEGER DEFAULT 6,
  patient_id_auto_increment BOOLEAN DEFAULT TRUE,
  patient_id_last_number INTEGER DEFAULT 0,
  domain_enabled BOOLEAN DEFAULT TRUE
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  description TEXT,
  UNIQUE(hospital_id, name)
);

-- Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  specialization TEXT,
  contact_number TEXT
);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  emergency_contact JSONB NOT NULL,
  medical_history JSONB,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  current_flow_step TEXT
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT
);

-- Triage Table
CREATE TABLE IF NOT EXISTS triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  vital_signs JSONB NOT NULL,
  chief_complaint TEXT NOT NULL,
  acuity_level INTEGER NOT NULL,
  notes TEXT,
  triaged_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_emergency BOOLEAN DEFAULT FALSE
);

-- Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  consultation_date TIMESTAMPTZ DEFAULT now(),
  chief_complaint TEXT NOT NULL,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB,
  notes TEXT,
  medical_certificate BOOLEAN DEFAULT FALSE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  pharmacy_status TEXT,
  pharmacy_id TEXT
);

-- Vital Signs Table
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  temperature NUMERIC,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation INTEGER,
  weight NUMERIC,
  height NUMERIC,
  bmi NUMERIC,
  pain_level SMALLINT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Lab Results Table
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  test_date TIMESTAMPTZ DEFAULT now(),
  results JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

-- Radiology Results Table
CREATE TABLE IF NOT EXISTS radiology_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL,
  scan_date TIMESTAMPTZ DEFAULT now(),
  results JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  is_emergency BOOLEAN DEFAULT FALSE
);

-- Pharmacy Table
CREATE TABLE IF NOT EXISTS pharmacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  medications JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  dispensed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  dispensed_at TIMESTAMPTZ,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  is_emergency BOOLEAN DEFAULT FALSE
);

-- Billing Table
CREATE TABLE IF NOT EXISTS billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  services JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  insurance_info JSONB,
  payment_date TIMESTAMPTZ
);

-- Inpatients Table
CREATE TABLE IF NOT EXISTS inpatients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  admission_date TIMESTAMPTZ DEFAULT now(),
  discharge_date TIMESTAMPTZ,
  ward_id TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  attending_doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'admitted',
  notes TEXT,
  vital_signs_history JSONB,
  medication_schedule JSONB
);

-- Allergies Table
CREATE TABLE IF NOT EXISTS allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  allergen_type TEXT NOT NULL,
  reaction TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  onset_date TIMESTAMPTZ,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Immunizations Table
CREATE TABLE IF NOT EXISTS immunizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccine_type TEXT NOT NULL,
  dose_number INTEGER NOT NULL,
  administration_date TIMESTAMPTZ NOT NULL,
  next_dose_due TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  administered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT
);

-- Medical History Table
CREATE TABLE IF NOT EXISTS medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  diagnosis_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  treatment TEXT,
  diagnosed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  tags TEXT[],
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Care Plans Table
CREATE TABLE IF NOT EXISTS care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  goals JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  referring_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_date TIMESTAMPTZ DEFAULT now(),
  reason TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'routine',
  status TEXT NOT NULL DEFAULT 'pending',
  appointment_date TIMESTAMPTZ,
  notes TEXT
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);

-- System Modules Table
CREATE TABLE IF NOT EXISTS system_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB,
  version TEXT NOT NULL
);

-- Module Permissions Table
CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  module_id UUID NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permissions JSONB NOT NULL,
  UNIQUE(module_id, role)
);

-- Pricing Plans Table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  billing_cycle TEXT NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_users INTEGER NOT NULL,
  max_storage_gb INTEGER NOT NULL
);

-- Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER NOT NULL,
  current_users INTEGER DEFAULT 0,
  features JSONB,
  billing_info JSONB,
  purchased_add_ons JSONB,
  UNIQUE(hospital_id)
);

-- Clinical Protocols Table
CREATE TABLE IF NOT EXISTS clinical_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE
);

-- Clinical Settings Table
CREATE TABLE IF NOT EXISTS clinical_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  vital_signs_required TEXT[],
  acuity_levels JSONB,
  emergency_criteria JSONB,
  UNIQUE(hospital_id, type)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT
);

-- Billing Settings Table
CREATE TABLE IF NOT EXISTS billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  payment_methods JSONB NOT NULL,
  tax_rates JSONB NOT NULL,
  invoice_settings JSONB NOT NULL,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  auto_payment_reminders BOOLEAN DEFAULT TRUE,
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  UNIQUE(hospital_id)
);

-- Support Settings Table
CREATE TABLE IF NOT EXISTS support_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  categories JSONB NOT NULL,
  sla_settings JSONB NOT NULL,
  notification_settings JSONB NOT NULL,
  auto_responses JSONB
);

-- Super Admin Stats View
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT
  (SELECT COUNT(*) FROM hospitals) AS total_hospitals,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM patients) AS total_patients,
  (SELECT COUNT(*) FROM departments) AS total_departments,
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') AS total_doctors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'nurse') AS total_nurses;

-- Search Patients Function
CREATE OR REPLACE FUNCTION search_patients(search_term TEXT)
RETURNS SETOF patients AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM patients
  WHERE
    first_name ILIKE '%' || search_term || '%' OR
    last_name ILIKE '%' || search_term || '%' OR
    contact_number ILIKE '%' || search_term || '%' OR
    email ILIKE '%' || search_term || '%' OR
    address ILIKE '%' || search_term || '%' OR
    id::TEXT ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE inpatients ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Hospital Staff Policies (for hospital-specific data)
CREATE POLICY "Hospital staff can view their hospital data"
  ON hospitals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = hospitals.id
    )
  );

-- Department Policies
CREATE POLICY "Hospital staff can view departments in their hospital"
  ON departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = departments.hospital_id
    )
  );

-- Patient Policies
CREATE POLICY "Hospital staff can view patients in their hospital"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = patients.hospital_id
    )
  );

-- Insert default data
INSERT INTO system_settings (key, value, description)
VALUES 
  ('system.name', '"Hospital Management System"', 'System name displayed in UI'),
  ('system.language', '"en"', 'Default system language'),
  ('system.date_format', '"YYYY-MM-DD"', 'Default date format'),
  ('system.time_format', '"HH:mm:ss"', 'Default time format'),
  ('system.currency', '"USD"', 'Default currency'),
  ('system.maintenance_mode', 'false', 'System maintenance mode'),
  ('system.main_domain', '"searchable.today"', 'Main domain for hospital subdomains'),
  ('email.smtp_host', '"smtp.example.com"', 'SMTP server host'),
  ('email.smtp_port', '587', 'SMTP server port'),
  ('email.from_address', '"noreply@example.com"', 'Default from email address'),
  ('security.session_timeout', '3600', 'Session timeout in seconds');

-- Insert default pricing plans
INSERT INTO pricing_plans (name, key, description, price, billing_cycle, features, max_users, max_storage_gb)
VALUES
  ('Basic', 'basic', 'Essential features for small clinics', 49.99, 'month', '["patient_management", "appointments", "billing"]', 5, 10),
  ('Professional', 'professional', 'Complete solution for medium practices', 99.99, 'month', '["patient_management", "appointments", "billing", "laboratory", "pharmacy", "radiology"]', 15, 50),
  ('Enterprise', 'enterprise', 'Advanced features for hospitals', 199.99, 'month', '["patient_management", "appointments", "billing", "laboratory", "pharmacy", "radiology", "inpatient", "analytics"]', 50, 200);

-- Insert default system modules
INSERT INTO system_modules (name, key, description, is_active, version)
VALUES
  ('Patient Management', 'patient_management', 'Core patient management functionality', TRUE, '1.0.0'),
  ('Appointments', 'appointments', 'Appointment scheduling and management', TRUE, '1.0.0'),
  ('Billing', 'billing', 'Billing and invoicing', TRUE, '1.0.0'),
  ('Laboratory', 'laboratory', 'Laboratory test management', TRUE, '1.0.0'),
  ('Pharmacy', 'pharmacy', 'Pharmacy and medication management', TRUE, '1.0.0'),
  ('Radiology', 'radiology', 'Radiology and imaging', TRUE, '1.0.0');