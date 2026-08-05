from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Patient Profile Schemas
class PatientProfileBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_conditions: Optional[str] = None
    surgery_type: Optional[str] = None
    discharge_date: Optional[datetime] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_2_name: Optional[str] = None
    emergency_contact_2_phone: Optional[str] = None
    notification_preferences: Optional[str] = "email,in-app"

class PatientProfileResponse(PatientProfileBase):
    id: int
    user_id: int
    recovery_score: float

    class Config:
        from_attributes = True

# Symptom Log Schemas
class SymptomLogCreate(BaseModel):
    pain_level: int = Field(..., ge=0, le=10)
    temperature: Optional[float] = None
    heart_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    notes: Optional[str] = None

class SymptomLogResponse(SymptomLogCreate):
    id: int
    patient_id: int
    timestamp: datetime
    warning_triggered: bool

    class Config:
        from_attributes = True

# Medication Schemas
class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    times_of_day: str
    instructions: Optional[str] = None
    end_date: Optional[datetime] = None

class MedicationResponse(MedicationBase):
    id: int
    patient_id: int
    start_date: datetime
    active: bool

    class Config:
        from_attributes = True

class MedicationAdherenceSubmit(BaseModel):
    medication_id: int
    status: str  # taken, missed, skipped

# Appointment Schemas
class AppointmentCreate(BaseModel):
    title: str
    doctor_name: Optional[str] = None
    date_time: datetime
    location: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(AppointmentCreate):
    id: int
    patient_id: int
    status: str

    class Config:
        from_attributes = True

# Medical Report Schemas
class MedicalReportResponse(BaseModel):
    id: int
    patient_id: int
    filename: str
    file_type: str
    upload_timestamp: datetime
    summary: Optional[str] = None
    comparison_result: Optional[str] = None

    class Config:
        from_attributes = True

# Timeline Schemas
class TimelineEventResponse(BaseModel):
    id: int
    patient_id: int
    event_type: str
    title: str
    description: Optional[str] = None
    timestamp: datetime
    reference_id: Optional[int] = None

    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessageRequest(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    patient_id: int
    sender: str
    message: str
    timestamp: datetime
    has_warning: bool

    class Config:
        from_attributes = True

# Dashboard Schema
class DashboardStats(BaseModel):
    recovery_score: float
    medication_adherence_rate: float
    symptoms_status: str  # e.g., Stable, Warning, Critical
    daily_checklist_percentage: int
    notifications_count: int
    upcoming_appointments: List[AppointmentResponse]
    today_medications: List[dict]  # Custom dict with medication details and adherence status
    recent_events: List[TimelineEventResponse]
    ai_insights: List[str]
