from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="patient")  # patient, caregiver, admin
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient_profile = relationship("PatientProfile", foreign_keys="[PatientProfile.user_id]", back_populates="user", uselist=False)

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    medical_conditions = Column(String, nullable=True)  # Comma separated or text
    surgery_type = Column(String, nullable=True)  # e.g., Coronary Bypass, Knee Replacement
    discharge_date = Column(DateTime, nullable=True)
    recovery_score = Column(Float, default=100.0)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Emergency Contact 1
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    
    # Emergency Contact 2
    emergency_contact_2_name = Column(String, nullable=True)
    emergency_contact_2_phone = Column(String, nullable=True)
    
    notification_preferences = Column(String, default="email,in-app")  # CSV

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="patient_profile")
    caregiver = relationship("User", foreign_keys=[caregiver_id])

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    pain_level = Column(Integer, default=0)  # 0 to 10
    temperature = Column(Float, nullable=True)  # Celsius
    heart_rate = Column(Integer, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    oxygen_saturation = Column(Integer, nullable=True)  # %
    notes = Column(Text, nullable=True)
    warning_triggered = Column(Boolean, default=False)

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # e.g., 50mg, 1 tablet
    frequency = Column(String, nullable=False)  # e.g., Daily, Twice Daily
    times_of_day = Column(String, nullable=False)  # e.g., 08:00, 20:00 (comma separated)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)
    instructions = Column(Text, nullable=True)

class MedicationAdherence(Base):
    __tablename__ = "medication_adherence"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="taken")  # taken, missed, skipped

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, png, jpg
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    comparison_result = Column(Text, nullable=True)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    doctor_name = Column(String, nullable=True)
    date_time = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="upcoming")  # upcoming, completed, cancelled

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String, nullable=False)  # symptom, medication, report, appointment, milestone
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    reference_id = Column(Integer, nullable=True)  # ID of related entity

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender = Column(String, nullable=False)  # user, assistant (supervisor/worker name)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    has_warning = Column(Boolean, default=False)
