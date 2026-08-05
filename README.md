# CareFlow — AI Post-Treatment Care Platform

A production-quality, AI-powered post-discharge recovery platform built for national AI hackathon demonstration.

## Project Structure

```
E:\careflow\
├── backend\                  # FastAPI Python server
│   ├── .venv\                # Python virtual environment
│   ├── .env                  # Environment variables (API keys, JWT secret)
│   ├── requirements.txt      # Python dependencies
│   ├── main.py               # FastAPI app + all API routes
│   ├── config.py             # Pydantic settings
│   ├── database.py           # SQLAlchemy session management
│   ├── models.py             # Database models
│   ├── schemas.py            # Pydantic validation schemas
│   ├── auth.py               # JWT authentication
│   ├── agents_orch.py        # Supervisor-Worker Multi-Agent orchestration
│   ├── rag_service.py        # RAG vector search with clinical guidelines
│   ├── extractor.py          # PDF/Image text extraction (OCR)
│   └── demo_data.py          # Database seeding with demo patient
├── frontend\                 # React + Vite + TypeScript
│   ├── src\
│   │   ├── components\       # Sidebar, Navbar, SymptomModal
│   │   ├── pages\            # Dashboard, Analytics, Chat, Reports, Timeline, Settings
│   │   ├── services\         # Axios API client
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── App.tsx           # Main router + auth state
│   ├── tailwind.config.js    # Custom brand theme
│   └── package.json          # Frontend dependencies
└── start.py                  # One-command startup launcher
```

## Quick Start

### Step 1: Start Backend
```powershell
# Open terminal in E:\careflow\backend
.\backend\.venv\Scripts\uvicorn backend.main:app --reload --port 8000
```

### Step 2: Start Frontend (new terminal)
```powershell
# Open terminal in E:\careflow\frontend  
# Ensure Node.js is in PATH
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run dev
```

### Or Use the All-in-One Launcher
```powershell
py E:\careflow\start.py
```

## Demo Login Credentials

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Patient  | patient@example.com      | password   |
| Caregiver| caregiver@example.com    | password   |
| Quick    | *Click Demo Patient Login* | —        |

## Multi-Agent Architecture

```
User Query
    │
    ▼
┌─────────────────────┐
│   Supervisor Agent  │  ← Routes intent to correct worker
└──────────┬──────────┘
           │
    ┌──────┴──────────────────────────────────────┐
    │      Specialized Worker Agents               │
    ├─ EmergencyAgent   (chest pain, critical)     │
    ├─ AnalysisAgent    (reports + RAG search)     │
    ├─ TrackingAgent    (vitals, symptom trends)   │
    ├─ MedicationAgent  (drugs, dosage, schedule)  │
    ├─ NutritionAgent   (diet, proteins, fluids)   │
    └─ AppointmentAgent (followups, scheduling)    │
    └─────────────────────────────────────────────┘
```

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/register` | POST | Register a new account |
| `/api/auth/demo-login` | POST | Quick demo patient login |
| `/api/patient/dashboard` | GET | Full dashboard statistics |
| `/api/patient/symptoms` | GET/POST | Symptom log management |
| `/api/patient/medications` | GET | Active medication list |
| `/api/patient/medications/adherence` | POST | Log a dose as taken/missed |
| `/api/patient/appointments` | GET/POST | Appointment management |
| `/api/patient/reports` | GET/POST | Upload + analyze reports |
| `/api/patient/timeline` | GET | Full clinical history |
| `/api/patient/chat` | GET/POST | AI chat with multi-agents |
| `/api/patient/settings` | GET/PUT | Profile configuration |
| `/docs` | GET | Swagger API documentation |

## Environment Variables (`.env`)

```
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./careflow.db   # or PostgreSQL URL
JWT_SECRET=your_secure_secret_here
```
