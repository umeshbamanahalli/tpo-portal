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
    batch_year INT DEFAULT 2026,
    intake_type VARCHAR(50) CHECK (intake_type IN ('Regular', 'Lateral', 'Transfer')),
    division VARCHAR(10) DEFAULT 'A',
    cgpa DECIMAL(4,2) DEFAULT 0.00,
    placement_status VARCHAR(20) DEFAULT 'unplaced' CHECK (placement_status IN ('unplaced', 'placed', 'interned')),
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
    opportunity_type VARCHAR(20) DEFAULT 'Placement' CHECK (opportunity_type IN ('Placement', 'Internship', 'Training')),
    company_category VARCHAR(50) DEFAULT 'Service' CHECK (company_category IN ('Product', 'Service', 'Startup', 'MNC')),
    min_cgpa_required DECIMAL(4,2) NOT NULL,
    ctc_package DECIMAL(10,2), -- In LPA
    location VARCHAR(255) DEFAULT 'On-Campus',
    deadline DATE NOT NULL,
    interview_rounds JSONB, -- Stores round details like [{"name": "Aptitude", "order": 1}]
    interview_material_url TEXT, -- Link to preparation materials
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Applications Table (Junction Table)
CREATE TABLE applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID REFERENCES placement_drives(drive_id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected', 'selected')),
    current_round_index INT DEFAULT 0,
    shortlist_status VARCHAR(20) DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drive_id, student_id) -- Prevents duplicate applications
);

-- 7. Define the rounds for a specific company drive
CREATE TABLE IF NOT EXISTS drive_rounds (
    round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID REFERENCES placement_drives(drive_id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    round_name VARCHAR(100) NOT NULL,
    round_date DATE,
    UNIQUE(drive_id, round_number)
);

-- 8. Track student progress through rounds
CREATE TABLE IF NOT EXISTS student_round_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(application_id) ON DELETE CASCADE,
    round_id UUID REFERENCES drive_rounds(round_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'rejected')),
    remarks TEXT,
    UNIQUE(application_id, round_id)
);

-- 9. Training and Calendar Sessions
CREATE TABLE IF NOT EXISTS training_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    trainer_name VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    meeting_link TEXT,
    recording_url TEXT,
    resource_url TEXT,
    department_eligibility VARCHAR(100)
);

-- 10. Academic Certifications Tracking
CREATE TABLE academic_certifications (
    cert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    cert_name VARCHAR(255) NOT NULL,
    issuing_org VARCHAR(255),
    issue_date DATE,
    cert_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications Table (Requirement 17)
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- why we use postgresql

-- We use PostgreSQL (often called Postgres) because it is widely considered the most advanced, stable, and flexible open-source relational database in the world. While many databases excel at one specific thing, Postgres is the "Swiss Army Knife" of data management.

-- Here is why it is the go-to choice for modern full-stack applications like your TPO Portal:

-- 1. Advanced Data Types (Beyond Rows and Columns)
-- Unlike standard SQL databases that only handle text and numbers, Postgres allows you to store complex data.

-- JSONB Support: You can store and index JSON data. This gives you the flexibility of a NoSQL database (like MongoDB) with the reliability of a Relational database.

-- Geometric/GIS Data: It has native support for coordinates and maps through the PostGIS extension.

-- UUIDs: As seen in your schema, Postgres handles 128-bit Universally Unique Identifiers natively and efficiently.

-- 2. Extreme Data Integrity (ACID Compliance)
-- In a placement system, data accuracy is non-negotiable. You cannot have a student "selected" for a job if the company record was deleted a second earlier.

-- ACID: Postgres ensures Atomicity, Consistency, Isolation, and Durability.

-- Strict Constraints: It excels at enforcing Foreign Key constraints, CHECK clauses (like your role validation), and unique indexes to prevent duplicate or corrupt data.

-- 3. Reliability and "Set It and Forget It"
-- Postgres is famous for its "rock-solid" nature. It rarely crashes, even under heavy load. It handles high concurrency—meaning hundreds of students can apply for the same job drive at the exact same millisecond without the database locking up or losing an application.

-- 4. Extensibility
-- You can add new functionality to Postgres without rewriting the core engine.

-- Extensions: If you need full-text search (like Google Search for your student records), you can enable the pg_trgm extension.

-- Custom Functions: You can write database logic in multiple languages, including SQL, PL/pgSQL, Python, and even JavaScript.

-- 5. Performance for Complex Queries
-- Standard databases slow down when you start joining 5 or 6 tables together. Postgres has a very sophisticated Query Planner that analyzes your SQL and finds the most efficient mathematical path to retrieve the data. This is vital for TPO admins who need to generate complex reports (e.g., "Show me all CSE students with > 8.5 CGPA who have not yet been shortlisted by any company").

-- Summary Table: Postgres vs. Others
-- Feature	PostgreSQL	MySQL / MariaDB	MongoDB
-- Data Type	Relational + Document	Relational	Document (NoSQL)
-- Integrity	Very Strict	Moderate	Flexible (Low)
-- JSON Support	Native & Indexed	Limited	Primary
-- Best For	Complex Apps, FinTech	Simple Web Apps	Rapid Prototyping

-- new sql commands added