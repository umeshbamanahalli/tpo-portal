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
