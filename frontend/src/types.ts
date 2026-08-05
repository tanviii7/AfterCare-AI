export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'patient' | 'caregiver' | 'admin';
  created_at: string;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  age: number | null;
  gender: string | null;
  medical_conditions: string | null;
  surgery_type: string | null;
  discharge_date: string | null;
  recovery_score: number;
  caregiver_id: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_2_name: string | null;
  emergency_contact_2_phone: string | null;
  notification_preferences: string;
}

export interface SymptomLog {
  id: number;
  patient_id: number;
  timestamp: string;
  pain_level: number;
  temperature: number | null;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  oxygen_saturation: number | null;
  notes: string | null;
  warning_triggered: boolean;
}

export interface Medication {
  id: number;
  patient_id: number;
  name: string;
  dosage: string;
  frequency: string;
  times_of_day: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  instructions: string | null;
}

export interface MedicationToday {
  id: number;
  name: string;
  dosage: string;
  times_of_day: string;
  instructions: string | null;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
}

export interface Appointment {
  id: number;
  patient_id: number;
  title: string;
  doctor_name: string | null;
  date_time: string;
  location: string | null;
  notes: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface MedicalReport {
  id: number;
  patient_id: number;
  filename: string;
  file_type: string;
  upload_timestamp: string;
  summary: string | null;
  comparison_result: string | null;
}

export interface TimelineEvent {
  id: number;
  patient_id: number;
  event_type: 'symptom' | 'medication' | 'report' | 'appointment' | 'milestone';
  title: string;
  description: string | null;
  timestamp: string;
  reference_id: number | null;
}

export interface ChatMessage {
  id: number;
  patient_id: number;
  sender: string;
  message: string;
  timestamp: string;
  has_warning: boolean;
}

export interface DashboardStats {
  recovery_score: number;
  medication_adherence_rate: number;
  symptoms_status: 'Stable' | 'Warning' | 'Critical';
  daily_checklist_percentage: number;
  notifications_count: number;
  upcoming_appointments: Appointment[];
  today_medications: MedicationToday[];
  recent_events: TimelineEvent[];
  ai_insights: string[];
}
