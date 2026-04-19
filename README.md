TPO Portal (Training & Placement System)
A full-stack web application to manage campus placements, allowing students, companies, and admins to interact efficiently.

Built using React + Node.js + PostgreSQL.

Features
Company Dashboard
Post placement drives

View applicants for each drive

Shortlist students

View basic analytics

Student Portal
View available drives

Apply for jobs

Track application status

Admin Panel
Approve company registrations

Manage students and drives

Monitor all applications

Tech Stack
Frontend: React (Vite)

Backend: Node.js + Express

Database: PostgreSQL

Authentication: JWT

Project Structure
Plaintext
tpo-portal/
│
├── frontend/      # React application
├── backend/       # Node.js + Express API
└── README.md
Setup Instructions (Run Locally)
1. Clone Repository
Bash
git clone https://github.com/your-username/tpo-portal.git
cd tpo-portal
2. Backend Setup
Bash
cd backend
npm install
Create a .env file inside the backend folder:

Plaintext
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
Start backend server:

Bash
node index.js
Backend will run on:
http://localhost:5000

3. Frontend Setup
Open a new terminal:

Bash
cd frontend
npm install
npm run dev
Frontend will run on:
http://localhost:5173

API Base URL
http://localhost:5000/api

Important Notes
Make sure backend is running before frontend.

PostgreSQL database must be configured correctly.

Update .env file with correct database credentials.

Do not expose .env file publicly.

Author
Your Name

Future Improvements
Resume upload feature

Email notifications

Interview scheduling system

Advanced analytics dashboard

License
This project is for educational purposes.
