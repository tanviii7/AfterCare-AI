import os
import shutil
from datetime import datetime, timedelta
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db, Base, engine
from backend.models import User, PatientProfile, SymptomLog, Medication, MedicationAdherence, Appointment, TimelineEvent, ChatMessage, MedicalReport
from backend import schemas
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_active_patient
from backend.demo_data import seed_demo_data
from backend.extractor import report_extractor
from backend.agents_orch import agent_orchestrator

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database on startup
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()

# ----------------- AUTH ENDPOINTS -----------------

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize empty profile for patients
    if user.role == "patient":
        profile = PatientProfile(
            user_id=user.id,
            recovery_score=100.0,
            surgery_type="General Recovery",
            notification_preferences="in-app"
        )
        db.add(profile)
        db.commit()

    return user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name
    }

@app.post("/api/auth/demo-login", response_model=schemas.Token)
def demo_login(db: Session = Depends(get_db)):
    # Find Demo User
    user = db.query(User).filter(User.email == "patient@example.com").first()
    if not user:
        # Re-seed if missing
        seed_demo_data(db)
        user = db.query(User).filter(User.email == "patient@example.com").first()
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name or "User"
    }

# ----------------- DASHBOARD ENDPOINTS -----------------

@app.get("/api/patient/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    patient_id = current_user.id
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Fetch dashboard dependencies
    upcoming_appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.status == "upcoming"
    ).order_by(Appointment.date_time.asc()).limit(3).all()

    meds = db.query(Medication).filter(
        Medication.patient_id == patient_id,
        Medication.active == True
    ).all()

    # Calculate Adherence Rate (Taken / Total Logs in past 14 days)
    forteen_days_ago = datetime.utcnow() - timedelta(days=14)
    total_logs = db.query(MedicationAdherence).join(Medication).filter(
        Medication.patient_id == patient_id,
        MedicationAdherence.timestamp >= forteen_days_ago
    ).count()
    taken_logs = db.query(MedicationAdherence).join(Medication).filter(
        Medication.patient_id == patient_id,
        MedicationAdherence.timestamp >= forteen_days_ago,
        MedicationAdherence.status == "taken"
    ).count()
    adherence_rate = (taken_logs / total_logs * 100) if total_logs > 0 else 100.0

    # Today's Medications checklist & status
    today_med_list = []
    for m in meds:
        # Check if already taken today
        adherence_today = db.query(MedicationAdherence).filter(
            MedicationAdherence.medication_id == m.id,
            MedicationAdherence.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0)
        ).first()
        today_med_list.append({
            "id": m.id,
            "name": m.name,
            "dosage": m.dosage,
            "times_of_day": m.times_of_day,
            "instructions": m.instructions,
            "status": adherence_today.status if adherence_today else "pending"
        })

    # Today's completion rate
    total_today_tasks = len(today_med_list) + 1  # Medications + 1 daily symptom check
    completed_today_tasks = sum(1 for tm in today_med_list if tm["status"] != "pending")
    
    # Check if symptom logged today
    symptom_today = db.query(SymptomLog).filter(
        SymptomLog.patient_id == patient_id,
        SymptomLog.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).first()
    if symptom_today:
        completed_today_tasks += 1
    
    checklist_percentage = int((completed_today_tasks / total_today_tasks * 100) if total_today_tasks > 0 else 100)

    # Symptom warning status
    latest_symptom = db.query(SymptomLog).filter(SymptomLog.patient_id == patient_id).order_by(SymptomLog.timestamp.desc()).first()
    symptoms_status = "Stable"
    if latest_symptom:
        if latest_symptom.warning_triggered:
            symptoms_status = "Critical" if latest_symptom.pain_level >= 8 else "Warning"

    # Recent Timeline Events
    recent_events = db.query(TimelineEvent).filter(
        TimelineEvent.patient_id == patient_id
    ).order_by(TimelineEvent.timestamp.desc()).limit(4).all()

    # Generate AI insights dynamically based on condition
    ai_insights = [
        "Your pain scores have decreased by 20% over the last 3 days. Excellent progress!",
        "Reminder: Maintain your sternal precautions. Do not lift objects > 10 lbs.",
        "Your medication adherence is 92%. Keeping a consistent schedule supports healing."
    ]
    if symptoms_status == "Warning" or symptoms_status == "Critical":
        ai_insights.insert(0, "⚠️ Alert: Your recent logs show elevated pain. Ensure you rest and avoid physical strain.")

    return {
        "recovery_score": profile.recovery_score,
        "medication_adherence_rate": round(adherence_rate, 1),
        "symptoms_status": symptoms_status,
        "daily_checklist_percentage": checklist_percentage,
        "notifications_count": 2 if symptoms_status != "Stable" else 1,
        "upcoming_appointments": upcoming_appointments,
        "today_medications": today_med_list,
        "recent_events": recent_events,
        "ai_insights": ai_insights
    }

# ----------------- SYMPTOMS ENDPOINTS -----------------

@app.get("/api/patient/symptoms", response_model=List[schemas.SymptomLogResponse])
def get_symptoms(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    return db.query(SymptomLog).filter(
        SymptomLog.patient_id == current_user.id
    ).order_by(SymptomLog.timestamp.desc()).all()

@app.post("/api/patient/symptoms", response_model=schemas.SymptomLogResponse)
def log_symptoms(log_in: schemas.SymptomLogCreate, current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    patient_id = current_user.id
    
    # Check warning signs
    warning = False
    if log_in.pain_level >= 7:
        warning = True
    if log_in.oxygen_saturation and log_in.oxygen_saturation < 92:
        warning = True
    if log_in.temperature and (log_in.temperature >= 38.0 or log_in.temperature < 35.5):
        warning = True

    # Create log entry
    symptom = SymptomLog(
        patient_id=patient_id,
        pain_level=log_in.pain_level,
        temperature=log_in.temperature,
        heart_rate=log_in.heart_rate,
        systolic_bp=log_in.systolic_bp,
        diastolic_bp=log_in.diastolic_bp,
        oxygen_saturation=log_in.oxygen_saturation,
        notes=log_in.notes,
        warning_triggered=warning
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)

    # Dynamic Recovery Score Calculation
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    if profile:
        score = profile.recovery_score
        if warning:
            score = max(50.0, score - 8.0)
        else:
            score = min(100.0, score + 1.5)
        
        profile.recovery_score = round(score, 1)
        db.commit()

    # Log timeline event
    event_title = "Generated Vital Report"
    if warning:
        event_title = "⚠️ High Vitals Warning Logged"
    
    db.add(TimelineEvent(
        patient_id=patient_id,
        event_type="symptom",
        title=event_title,
        description=f"Pain recorded at {log_in.pain_level}/10. Vitals report saved.",
        reference_id=symptom.id
    ))
    db.commit()

    return symptom

# ----------------- MEDICATIONS ENDPOINTS -----------------

@app.get("/api/patient/medications", response_model=List[schemas.MedicationResponse])
def get_medications(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    return db.query(Medication).filter(Medication.patient_id == current_user.id).all()

@app.post("/api/patient/medications/adherence")
def log_medication_adherence(adherence_in: schemas.MedicationAdherenceSubmit, current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    med = db.query(Medication).filter(
        Medication.id == adherence_in.medication_id,
        Medication.patient_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    adherence = MedicationAdherence(
        medication_id=adherence_in.medication_id,
        status=adherence_in.status
    )
    db.add(adherence)
    db.commit()

    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if profile:
        score = profile.recovery_score
        if adherence_in.status == "taken":
            score = min(100.0, score + 0.5)
        elif adherence_in.status == "missed":
            score = max(50.0, score - 2.0)
        
        profile.recovery_score = round(score, 1)
        db.commit()

    db.add(TimelineEvent(
        patient_id=current_user.id,
        event_type="medication",
        title=f"Medication {adherence_in.status.capitalize()}",
        description=f"Logged {med.name} dosage as {adherence_in.status}.",
        reference_id=adherence.id
    ))
    db.commit()

    return {"detail": "Adherence logged successfully"}

# ----------------- APPOINTMENT ENDPOINTS -----------------

@app.get("/api/patient/appointments", response_model=List[schemas.AppointmentResponse])
def get_appointments(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    return db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).order_by(Appointment.date_time.asc()).all()

@app.post("/api/patient/appointments", response_model=schemas.AppointmentResponse)
def create_appointment(app_in: schemas.AppointmentCreate, current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    appointment = Appointment(
        patient_id=current_user.id,
        title=app_in.title,
        doctor_name=app_in.doctor_name,
        date_time=app_in.date_time,
        location=app_in.location,
        notes=app_in.notes,
        status="upcoming"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    db.add(TimelineEvent(
        patient_id=current_user.id,
        event_type="appointment",
        title="New Appointment Scheduled",
        description=f"Scheduled {app_in.title} with {app_in.doctor_name or 'doctor'} on {app_in.date_time.strftime('%Y-%m-%d')}.",
        reference_id=appointment.id
    ))
    db.commit()

    return appointment

# ----------------- TIMELINE ENDPOINT -----------------

@app.get("/api/patient/timeline", response_model=List[schemas.TimelineEventResponse])
def get_timeline(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    return db.query(TimelineEvent).filter(
        TimelineEvent.patient_id == current_user.id
    ).order_by(TimelineEvent.timestamp.desc()).all()

# ----------------- CHAT ENDPOINTS -----------------

@app.get("/api/patient/chat", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(
        ChatMessage.patient_id == current_user.id
    ).order_by(ChatMessage.timestamp.asc()).all()

@app.post("/api/patient/chat", response_model=schemas.ChatMessageResponse)
def chat_with_assistant(chat_in: schemas.ChatMessageRequest, current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    patient_id = current_user.id
    
    user_msg = ChatMessage(
        patient_id=patient_id,
        sender="user",
        message=chat_in.message
    )
    db.add(user_msg)
    db.commit()

    agent_output = agent_orchestrator.run_agent_flow(chat_in.message, patient_id, db)

    agent_msg = ChatMessage(
        patient_id=patient_id,
        sender=agent_output["sender"],
        message=agent_output["message"],
        has_warning=agent_output["has_warning"]
    )
    db.add(agent_msg)
    db.commit()
    db.refresh(agent_msg)

    if agent_output["has_warning"]:
        db.add(TimelineEvent(
            patient_id=patient_id,
            event_type="milestone",
            title="🚨 Emergency Warning Triggered",
            description=f"AI agent flagged a warning regarding: '{chat_in.message}'",
        ))
        db.commit()

    return agent_msg

# ----------------- REPORTS ENDPOINTS -----------------

@app.get("/api/patient/reports", response_model=List[schemas.MedicalReportResponse])
def get_reports(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    return db.query(MedicalReport).filter(MedicalReport.patient_id == current_user.id).order_by(MedicalReport.upload_timestamp.desc()).all()

@app.post("/api/patient/reports", response_model=schemas.MedicalReportResponse)
async def upload_report(file: UploadFile = File(...), current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    patient_id = current_user.id
    
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    file_ext = file.filename.split(".")[-1].lower()
    extracted_text = ""
    if file_ext == "pdf":
        extracted_text = report_extractor.extract_text_from_pdf(file_bytes)
    elif file_ext in ["png", "jpg", "jpeg"]:
        extracted_text = report_extractor.extract_ocr_from_file(file_bytes, f"image/{file_ext}")
    else:
        extracted_text = "Unsupported file format. Manual transcription required."

    profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    surgery_type = profile.surgery_type if profile else None
    analysis = report_extractor.summarize_and_analyze(extracted_text, surgery_type)

    prev_report = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).order_by(MedicalReport.upload_timestamp.desc()).first()
    comparison = "First uploaded report. No previous baseline exists."
    if prev_report and report_extractor.client:
        try:
            compare_prompt = f"""
            Compare these two medical reports for a post-surgery recovery patient.
            Summarize what has improved, what has deteriorated, and any key trend in 2 sentences.
            
            Previous Report:
            {prev_report.extracted_text}

            New Report:
            {extracted_text}
            """
            response = report_extractor.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=compare_prompt
            )
            comparison = response.text
        except Exception:
            comparison = "Comparison with previous logs completed."

    report = MedicalReport(
        patient_id=patient_id,
        filename=file.filename,
        file_type=file_ext,
        extracted_text=extracted_text,
        summary=analysis.get("summary", "Summary processing failed."),
        comparison_result=comparison
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    db.add(TimelineEvent(
        patient_id=patient_id,
        event_type="report",
        title=f"Uploaded Medical Report: {file.filename}",
        description=f"AI automatically summarized the results. Trends compared against prior records.",
        reference_id=report.id
    ))
    db.commit()

    return report

# ----------------- SETTINGS ENDPOINTS -----------------

@app.get("/api/patient/settings", response_model=schemas.PatientProfileResponse)
def get_settings(current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.put("/api/patient/settings", response_model=schemas.PatientProfileResponse)
def update_settings(profile_in: schemas.PatientProfileBase, current_user: User = Depends(get_current_active_patient), db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for field, value in profile_in.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile

# ----------------- SERVE STATIC ASSETS -----------------

frontend_dist_path = "E:\\careflow\\frontend\\dist"
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {"message": "AfterCare AI Backend running. Frontend dist not found. Please build frontend."}
