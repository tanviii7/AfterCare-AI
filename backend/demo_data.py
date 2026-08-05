from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import User, PatientProfile, SymptomLog, Medication, MedicationAdherence, Appointment, TimelineEvent, ChatMessage, MedicalReport
from backend.auth import get_password_hash

def seed_demo_data(db: Session):
    # Check if data already exists
    if db.query(User).filter(User.email == "patient@example.com").first():
        return

    print("Seeding demo data...")

    # 1. Create Users
    hashed_pwd = get_password_hash("password")
    
    patient_user = User(
        email="patient@example.com",
        hashed_password=hashed_pwd,
        full_name="User",
        role="patient",
        created_at=datetime.utcnow() - timedelta(days=15)
    )
    
    caregiver_user = User(
        email="caregiver@example.com",
        hashed_password=hashed_pwd,
        full_name="Dr. Sarah Smith",
        role="caregiver",
        created_at=datetime.utcnow() - timedelta(days=15)
    )

    db.add(patient_user)
    db.add(caregiver_user)
    db.commit()
    db.refresh(patient_user)
    db.refresh(caregiver_user)

    # 2. Create Patient Profile
    profile = PatientProfile(
        user_id=patient_user.id,
        age=65,
        gender="Male",
        medical_conditions="Hypertension, Mild Hyperlipidemia",
        surgery_type="Coronary Artery Bypass Graft (CABG)",
        discharge_date=datetime.utcnow() - timedelta(days=5),
        recovery_score=82.5,
        caregiver_id=caregiver_user.id,
        emergency_contact_name="Mary Doe",
        emergency_contact_phone="+1-555-0199",
        emergency_contact_2_name="Robert Doe",
        emergency_contact_2_phone="+1-555-0288",
        notification_preferences="email,in-app,sms"
    )
    db.add(profile)
    db.commit()

    # 3. Create Medications
    med1 = Medication(
        patient_id=patient_user.id,
        name="Metoprolol Succinate",
        dosage="50mg",
        frequency="Once Daily",
        times_of_day="08:00",
        start_date=datetime.utcnow() - timedelta(days=5),
        instructions="Take with food. Monitor heart rate."
    )
    med2 = Medication(
        patient_id=patient_user.id,
        name="Aspirin",
        dosage="81mg",
        frequency="Once Daily",
        times_of_day="08:00",
        start_date=datetime.utcnow() - timedelta(days=5),
        instructions="Take with a full glass of water. Do not crush."
    )
    med3 = Medication(
        patient_id=patient_user.id,
        name="Docusate Sodium",
        dosage="100mg",
        frequency="Twice Daily",
        times_of_day="08:00, 20:00",
        start_date=datetime.utcnow() - timedelta(days=5),
        instructions="Take at morning and night to prevent constipation."
    )
    db.add_all([med1, med2, med3])
    db.commit()
    db.refresh(med1)
    db.refresh(med2)
    db.refresh(med3)

    # 4. Create Medication Adherence Logs (past 5 days)
    for day in range(1, 6):
        date_time = datetime.utcnow() - timedelta(days=day)
        # Metoprolol (Taken everyday except 3 days ago)
        status_m = "taken" if day != 3 else "missed"
        db.add(MedicationAdherence(medication_id=med1.id, timestamp=date_time.replace(hour=8, minute=5), status=status_m))
        
        # Aspirin (Always taken)
        db.add(MedicationAdherence(medication_id=med2.id, timestamp=date_time.replace(hour=8, minute=10), status="taken"))
        
        # Docusate (Taken twice daily, occasionally skipped night)
        db.add(MedicationAdherence(medication_id=med3.id, timestamp=date_time.replace(hour=8, minute=15), status="taken"))
        status_night = "taken" if day != 2 else "skipped"
        db.add(MedicationAdherence(medication_id=med3.id, timestamp=date_time.replace(hour=20, minute=10), status=status_night))

    # 5. Create Symptom Logs (past 5 days, showing improvement)
    # Day 5 (worst)
    db.add(SymptomLog(patient_id=patient_user.id, timestamp=datetime.utcnow() - timedelta(days=5), pain_level=7, temperature=37.5, heart_rate=88, systolic_bp=135, diastolic_bp=85, oxygen_saturation=96, notes="Discharge day. Chest wound is sore. Feel fatigued."))
    # Day 4
    db.add(SymptomLog(patient_id=patient_user.id, timestamp=datetime.utcnow() - timedelta(days=4), pain_level=6, temperature=37.2, heart_rate=82, systolic_bp=130, diastolic_bp=82, oxygen_saturation=97, notes="Slightly better. Resting in bed."))
    # Day 3
    db.add(SymptomLog(patient_id=patient_user.id, timestamp=datetime.utcnow() - timedelta(days=3), pain_level=5, temperature=36.9, heart_rate=78, systolic_bp=128, diastolic_bp=80, oxygen_saturation=98, notes="Walking around the living room. Pain is manageable with meds."))
    # Day 2
    db.add(SymptomLog(patient_id=patient_user.id, timestamp=datetime.utcnow() - timedelta(days=2), pain_level=4, temperature=36.8, heart_rate=75, systolic_bp=125, diastolic_bp=78, oxygen_saturation=98, notes="Sleeping better. Incision healing well."))
    # Day 1 (today)
    db.add(SymptomLog(patient_id=patient_user.id, timestamp=datetime.utcnow() - timedelta(days=1), pain_level=3, temperature=36.7, heart_rate=72, systolic_bp=120, diastolic_bp=75, oxygen_saturation=99, notes="Feeling stronger. Walked 10 minutes outside."))
    db.commit()

    # 6. Create Appointments
    app1 = Appointment(
        patient_id=patient_user.id,
        title="Cardiology Wound Check",
        doctor_name="Dr. Sarah Smith",
        date_time=datetime.utcnow() + timedelta(days=3, hours=10),
        location="Outpatient Clinic, Room 4B",
        notes="First post-op follow up to inspect surgical site and check sternum stability.",
        status="upcoming"
    )
    app2 = Appointment(
        patient_id=patient_user.id,
        title="Echocardiogram Diagnostic",
        doctor_name="Dr. Andrew Johnson",
        date_time=datetime.utcnow() + timedelta(days=14, hours=14),
        location="Cardiac Imaging Center",
        notes="Standard 3-week post-bypass imaging check.",
        status="upcoming"
    )
    db.add_all([app1, app2])
    db.commit()

    # 7. Create Timeline Events
    timeline_events = [
        TimelineEvent(patient_id=patient_user.id, event_type="milestone", title="Hospital Discharge", description="Discharged from St. Mary's Hospital after successful CABG surgery.", timestamp=datetime.utcnow() - timedelta(days=5)),
        TimelineEvent(patient_id=patient_user.id, event_type="medication", title="Medications Prescribed", description="Began prescription of Metoprolol, Aspirin, and Docusate Sodium.", timestamp=datetime.utcnow() - timedelta(days=5)),
        TimelineEvent(patient_id=patient_user.id, event_type="symptom", title="First Symptom Logging", description="Logged initial pain level of 7/10 and vitals post-discharge.", timestamp=datetime.utcnow() - timedelta(days=5)),
        TimelineEvent(patient_id=patient_user.id, event_type="report", title="Discharge Summary Uploaded", description="Uploaded official discharge report detailing bypass surgical specifications.", timestamp=datetime.utcnow() - timedelta(days=4)),
        TimelineEvent(patient_id=patient_user.id, event_type="milestone", title="First Outdoor Walk", description="Walked outside for 10 minutes without assistance.", timestamp=datetime.utcnow() - timedelta(days=1))
    ]
    db.add_all(timeline_events)
    db.commit()

    # 8. Create Sample Report
    sample_report = MedicalReport(
        patient_id=patient_user.id,
        filename="discharge_summary.pdf",
        file_type="pdf",
        upload_timestamp=datetime.utcnow() - timedelta(days=4),
        extracted_text="St. Mary's Hospital Discharge Summary\nPatient Name: User\nDOB: 1961-04-12\nAdmitted: 2026-07-25, Discharged: 2026-07-30\nDiagnosis: Severe Coronary Artery Disease. Three-vessel disease.\nProcedure: Coronary Artery Bypass Graft x3 (LIMA to LAD, SVG to OM1, SVG to PDA).\nSurgeon: Dr. Robert Miller.\nIncision Status: Sternal closed with wire. Leg harvest site intact. No signs of infection at discharge.\nVitals at discharge: Temp 37.1C, HR 78, BP 122/76, O2 98%.\nMedications: Metoprolol Succinate 50mg daily, Aspirin 81mg daily, Docusate Sodium 100mg BID.\nInstructions: Lift no more than 10 lbs. Call clinic if weight increases by 2+ lbs/day.",
        summary="You were discharged from St. Mary's Hospital on July 30 after a successful 3-vessel Coronary Artery Bypass Graft (CABG) surgery. Your incision was clean with wires holding your breastbone stable. You are prescribed daily Metoprolol and Aspirin, plus Docusate for digestion. You should limit lifting to 10 lbs.",
        comparison_result="First upload. No previous reports available for comparison."
    )
    db.add(sample_report)
    db.commit()

    # 9. Create Chat Messages
    chat_logs = [
        ChatMessage(patient_id=patient_user.id, sender="user", message="What are my lifting restrictions?", timestamp=datetime.utcnow() - timedelta(hours=5)),
        ChatMessage(patient_id=patient_user.id, sender="AnalysisAgent", message="Based on your CABG discharge instructions, you must not lift anything heavier than 10 lbs (about 4.5 kg) for the first 6 to 8 weeks. This restriction is crucial to allow your breastbone (sternum) to heal fully and prevent injury. Avoid pushing, pulling, or twisting motions.", timestamp=datetime.utcnow() - timedelta(hours=5)),
        ChatMessage(patient_id=patient_user.id, sender="user", message="Can I eat fish during recovery?", timestamp=datetime.utcnow() - timedelta(hours=2)),
        ChatMessage(patient_id=patient_user.id, sender="NutritionAgent", message="Yes, fish is highly recommended! For post-bypass recovery, lean protein is essential for repairing tissue and wound healing. Baked or grilled fish (such as salmon or cod) provides high-quality protein and Omega-3 fatty acids, which reduce inflammation and promote heart health. Avoid greasy or fried fish.", timestamp=datetime.utcnow() - timedelta(hours=2))
    ]
    db.add_all(chat_logs)
    db.commit()

    print("Demo data seeded successfully.")
