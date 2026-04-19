-- ======================================================
-- PLACENEXT DMS - DATABASE SCHEMA & INITIALIZATION
-- ======================================================

-- 1. Cleanup existing tables (Order matters due to Foreign Keys)
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS placement_drives;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS jobs;

-- 2. Create Users Table (Primary Account Table)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'student', 'company')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Students Table (Linked to Users)
CREATE TABLE students (
    student_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    college_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    cgpa DECIMAL(4,2) DEFAULT 0.00,
    resume_url TEXT
);

-- 4. Create Companies Table (Linked to Users)
CREATE TABLE companies (
    company_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255),
    industry VARCHAR(100),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' -- For admin approval workflow
);

-- 5. Create Placement Drives Table (Job Postings)
CREATE TABLE placement_drives (
    drive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    job_role VARCHAR(255) NOT NULL,
    min_cgpa_required DECIMAL(4,2) NOT NULL,
    ctc_package DECIMAL(10,2), -- In LPA
    location VARCHAR(255) DEFAULT 'On-Campus',
    deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Applications Table (Junction Table)
CREATE TABLE applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID REFERENCES placement_drives(drive_id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected', 'selected')),
    shortlist_status VARCHAR(20) DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drive_id, student_id) -- Prevents duplicate applications
);

-- ======================================================
-- SAMPLE DATA & UTILITY QUERIES
-- ======================================================

-- Example: Insert a Company User
-- INSERT INTO users (email, password_hash, role) VALUES ('hr@google.com', 'hashed_pw', 'company');

-- Example: Select Joined Data
-- SELECT c.company_name, d.job_role, d.ctc_package 
-- FROM placement_drives d
-- JOIN companies c ON d.company_id = c.company_id;

-- View Table Structures
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
