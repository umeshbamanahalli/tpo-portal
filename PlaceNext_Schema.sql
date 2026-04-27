drop table students;
-- Create Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'student', 'company')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Students Table (Linked to Users)
CREATE TABLE students (
    student_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    college_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    cgpa DECIMAL(4,2) DEFAULT 0.00
);

select * from students;
select * from users;
select * from companies;
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url TEXT;
-- company
-- 1. Create Companies Table (Must come before drives)
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255),
    industry VARCHAR(100),
    location VARCHAR(100)
);

-- 2. Create Placement Drives Table
CREATE TABLE IF NOT EXISTS placement_drives (
    drive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
    job_role VARCHAR(255) NOT NULL,
    min_cgpa_required DECIMAL(4,2) NOT NULL,
    ctc_package DECIMAL(10,2), -- In LPA
    deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- First, create a user for the company
INSERT INTO users (email, password_hash, role) 
VALUES ('hr@google.com', 'hashedpassword', 'company') 
RETURNING user_id;

-- Copy that UUID and use it below
INSERT INTO companies (company_id, company_name, website_url) 
VALUES ('68b7ec9f-bbca-4112-92b6-00f15ca2a91f', 'Google', 'https://google.com');


INSERT INTO placement_drives (company_id, job_role, min_cgpa_required, ctc_package, deadline)
VALUES ('68b7ec9f-bbca-4112-92b6-00f15ca2a91f', 'Software Engineer', 7.5, 25.0, '2026-12-31');

select * from companies;

SELECT company_name, job_role, ctc_package 
FROM placement_drives 
JOIN companies ON placement_drives.company_id = companies.company_id;

CREATE TABLE IF NOT EXISTS applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID REFERENCES placement_drives(drive_id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected', 'selected')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drive_id, student_id) -- Prevents a student from applying twice to the same job
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
	company_id UUID,
    role VARCHAR(255) NOT NULL,
    salary VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    deadline DATE,
    company VARCHAR(255)  NULL,
    status VARCHAR(50) DEFAULT 'Active',
    description TEXT,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

drop table jobs;
select * from jobs;
select * from applications;
-- truncate table applications;
select * from placement_drives;
select * from companies;
select * from students;
select * from users;
ALTER TABLE jobs
ALTER COLUMN company_id TYPE UUID USING company_id::uuid;

INSERT INTO applications (drive_id, student_id, status)
VALUES (
    '5dd0e1e9-778b-43a0-b88f-123b6879bc1f',
    '5333d3d6-8c36-4ba5-9f20-832c26278afd',
    'applied'
);

ALTER TABLE applications 
ADD COLUMN shortlist_status VARCHAR(20) DEFAULT 'Pending';

SELECT check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'applications_status_check';

ALTER TABLE placement_drives ADD COLUMN location VARCHAR(255) DEFAULT 'On-Campus';

-- For the Drives table
ALTER TABLE placement_drives 
DROP CONSTRAINT IF EXISTS fk_company,
ADD CONSTRAINT fk_company 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

-- For the Applications table
ALTER TABLE applications 
ADD CONSTRAINT fk_drive_cascade
FOREIGN KEY (drive_id) 
REFERENCES placement_drives(drive_id) 
ON DELETE CASCADE;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- This query ensures you only get drives where the student meets the criteria
SELECT * FROM placement_drives 
WHERE status = 'active' 
ORDER BY created_at DESC;

SELECT * FROM placement_drives WHERE drive_id = 'cbadb9ce-261e-475a-b5b8-d0f54616aa3d';

-- Track Batch and Intake for Analytics
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS batch_year INT DEFAULT 2026, -- e.g., 2024, 2025, 2026
ADD COLUMN IF NOT EXISTS intake_type VARCHAR(50) CHECK (intake_type IN ('Regular', 'Lateral', 'Transfer')),
ADD COLUMN IF NOT EXISTS division VARCHAR(10) DEFAULT 'A',
ADD COLUMN IF NOT EXISTS placement_status VARCHAR(20) DEFAULT 'unplaced' CHECK (placement_status IN ('unplaced', 'placed', 'interned'));

-- Add Category to Placement Drives (Placement vs Internship vs Training)
ALTER TABLE placement_drives 
ADD COLUMN IF NOT EXISTS opportunity_type VARCHAR(20) DEFAULT 'Placement' CHECK (opportunity_type IN ('Placement', 'Internship', 'Training')),
ADD COLUMN IF NOT EXISTS company_category VARCHAR(50) DEFAULT 'Service' CHECK (company_category IN ('Product', 'Service', 'Startup', 'MNC')),
ADD COLUMN IF NOT EXISTS interview_material_url TEXT;

-- Define the rounds for a specific company drive
CREATE TABLE IF NOT EXISTS drive_rounds (
    round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID REFERENCES placement_drives(drive_id) ON DELETE CASCADE,
    round_number INT NOT NULL, -- 1, 2, 3...
    round_name VARCHAR(100) NOT NULL, -- 'Aptitude', 'Technical', 'HR'
    round_date DATE,
    UNIQUE(drive_id, round_number)
);

-- Track student progress through those rounds
CREATE TABLE IF NOT EXISTS student_round_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    round_id UUID REFERENCES drive_rounds(round_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'rejected')),
    remarks TEXT,
    UNIQUE(application_id, round_id)
);

CREATE TABLE IF NOT EXISTS training_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    trainer_name VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    meeting_link TEXT,
    department_eligibility VARCHAR(100) -- 'All' or 'CSE'
);

CREATE TABLE IF NOT EXISTS academic_certifications (
    cert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    cert_name VARCHAR(255) NOT NULL,
    issuing_org VARCHAR(255),
    issue_date DATE,
    cert_url TEXT
);


SELECT 
    r.round_name, 
    COUNT(srs.id) as student_count
FROM drive_rounds r
LEFT JOIN student_round_status srs ON r.round_id = srs.round_id
WHERE r.drive_id = 'YOUR_DRIVE_ID' AND srs.status = 'cleared'
GROUP BY r.round_name, r.round_number
ORDER BY r.round_number;