import json
from datetime import datetime
from sqlalchemy.orm import Session
from google import genai
from google.genai import types
from backend.config import settings
from backend.rag_service import rag_service
from backend.models import User, PatientProfile, SymptomLog, Medication, Appointment, ChatMessage

class AgentOrchestrator:
    def __init__(self):
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                print(f"AgentOrchestrator GenAI Init Error: {e}")

    def run_agent_flow(self, user_message: str, patient_id: int, db: Session) -> dict:
        """Runs the Supervisor-Worker Agent flow to process patient query."""
        # 1. Fetch Patient Context
        patient = db.query(User).filter(User.id == patient_id).first()
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
        symptoms = db.query(SymptomLog).filter(SymptomLog.patient_id == patient_id).order_by(SymptomLog.timestamp.desc()).all()
        medications = db.query(Medication).filter(Medication.patient_id == patient_id, Medication.active == True).all()
        appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id, Appointment.status == "upcoming").all()
        
        # Load recent chat history
        chat_history = db.query(ChatMessage).filter(ChatMessage.patient_id == patient_id).order_by(ChatMessage.timestamp.desc()).limit(6).all()
        chat_history_str = "\n".join([f"{m.sender}: {m.message}" for m in reversed(chat_history)])

        # Construct patient profile context
        surgery_type = profile.surgery_type if profile else "General Surgery"
        conditions = profile.medical_conditions if profile else "None"
        recent_symptom = symptoms[0] if symptoms else None
        symptom_str = f"Pain Level: {recent_symptom.pain_level}/10, Temp: {recent_symptom.temperature or 'N/A'}C, BP: {recent_symptom.systolic_bp or 'N/A'}/{recent_symptom.diastolic_bp or 'N/A'}, O2 Sat: {recent_symptom.oxygen_saturation or 'N/A'}%" if recent_symptom else "No logs yet."
        meds_str = ", ".join([f"{m.name} ({m.dosage}, {m.frequency})" for m in medications]) if medications else "No active medications."
        apps_str = ", ".join([f"{a.title} with {a.doctor_name or 'Doctor'} on {a.date_time.strftime('%Y-%m-%d %H:%M')}" for a in appointments]) if appointments else "No upcoming appointments."

        patient_context = f"""
        Patient Name: {patient.full_name if patient else 'User'}
        Recent Surgery: {surgery_type}
        Chronic Conditions: {conditions}
        Latest Vitals/Symptoms: {symptom_str}
        Current Medications: {meds_str}
        Upcoming Appointments: {apps_str}
        """

        # 2. EMERGENCY TRIGGER (Pre-check)
        # Emergency Agent is active: check for high-risk symptoms immediately.
        is_emergency = self._check_emergency_signs(user_message, recent_symptom)
        if is_emergency:
            return self._run_emergency_agent(user_message, patient_context)

        # 3. SUPERVISOR ROUTING
        # Ask Supervisor to route the message to the appropriate worker agent(s)
        agent_routing = self._supervisor_route(user_message, chat_history_str, patient_context)
        target_agent = agent_routing.get("target_agent", "General")

        # 4. EXECUTE WORKER AGENT
        if target_agent == "AnalysisAgent":
            response_text = self._run_analysis_agent(user_message, patient_context, db, patient_id)
        elif target_agent == "TrackingAgent":
            response_text = self._run_tracking_agent(user_message, patient_context, symptoms)
        elif target_agent == "MedicationAgent":
            response_text = self._run_medication_agent(user_message, patient_context, medications)
        elif target_agent == "NutritionAgent":
            response_text = self._run_nutrition_agent(user_message, patient_context, surgery_type)
        elif target_agent == "AppointmentAgent":
            response_text = self._run_appointment_agent(user_message, patient_context, appointments)
        else:
            response_text = self._run_general_agent(user_message, patient_context, chat_history_str)

        return {
            "sender": target_agent,
            "message": response_text,
            "has_warning": False,
            "action_required": False
        }

    def _check_emergency_signs(self, message: str, recent_symptom: SymptomLog) -> bool:
        """Inspects text and vitals for urgent warning signs."""
        urgent_keywords = [
            "chest pain", "difficulty breathing", "severe bleeding", "unconscious", "shortness of breath", "gasping", "heavy blood", "crushing pain",
            "सीने में दर्द", "सांस लेने में तकलीफ", "गंभीर रक्तस्राव", "दर्द" # Multilingual triggers
        ]
        message_lower = message.lower()
        if any(kw in message_lower for kw in urgent_keywords):
            return True
        
        # Check vitals if available
        if recent_symptom:
            if recent_symptom.pain_level >= 9:
                return True
            if recent_symptom.oxygen_saturation and recent_symptom.oxygen_saturation < 90:
                return True
            if recent_symptom.temperature and (recent_symptom.temperature >= 39.5 or recent_symptom.temperature < 35.0):
                return True
        return False

    def _supervisor_route(self, message: str, history: str, context: str) -> dict:
        """Asks Supervisor Agent to choose the target worker."""
        if not self.client:
            return {"target_agent": "General", "reason": "No API key"}

        prompt = f"""
        You are the Supervisor Agent for the AfterCare AI recovery platform.
        Your job is to read the patient's query and route it to ONE of these specialized worker agents:
        - **AnalysisAgent**: For explaining clinical reports, lab readings, comparing blood test results, or RAG-based surgical recovery guidelines.
        - **TrackingAgent**: For checking symptom logs, pain level progress, recovery trends, vitals, or logging history.
        - **MedicationAgent**: For dose reminders, schedule timings, drug interactions, or missed doses.
        - **NutritionAgent**: For diet recommendations, foods to avoid, hydration guidelines, and post-op protein intake.
        - **AppointmentAgent**: For scheduled hospital visits, follow-up exams, doctor consultations, and test schedules.
        - **General**: For greeting, chat fillers, general encouragement, or topics outside post-discharge recovery.

        Patient Context:
        {context}

        Recent Chat History:
        {history}

        User Query: "{message}"

        Respond ONLY with a JSON object containing:
        {{
            "target_agent": "AnalysisAgent" | "TrackingAgent" | "MedicationAgent" | "NutritionAgent" | "AppointmentAgent" | "General",
            "reason": "brief reason for routing"
        }}
        Do not output markdown code blocks.
        """
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Supervisor routing error: {e}")
            return {"target_agent": "General", "reason": "Routing failure fallback"}

    def _run_emergency_agent(self, message: str, context: str) -> dict:
        """Executes the Emergency Agent flow."""
        prompt = f"""
        You are the Emergency Agent of AfterCare AI.
        The patient has sent a query containing high-risk symptoms or vitals.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.).
        
        Write a concise, authoritative warning message instructing them to seek immediate medical attention (e.g. call 911/108, contact their surgeon, or visit the nearest ER).
        Provide clear, bulleted immediate actions they should take. Be reassuring but firm.

        Patient Context:
        {context}

        Patient Query: "{message}"
        """
        response_text = "🚨 **EMERGENCY WARNING** 🚨\n\nYour query indicates critical warning signs that require immediate evaluation."
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                response_text = response.text
            except Exception:
                pass
        
        return {
            "sender": "EmergencyAgent",
            "message": response_text,
            "has_warning": True,
            "action_required": True
        }

    def _run_analysis_agent(self, message: str, context: str, db: Session, patient_id: int) -> str:
        """Analysis Agent: explains medical report or pulls clinical facts using RAG."""
        rag_context = rag_service.search(message, top_k=2)

        prompt = f"""
        You are the Clinical Analysis Agent for AfterCare AI.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.). Do not answer in English if the user asked in another language.

        Your task is to answer the user's question by combining the Patient's medical context, their uploaded report info, and the retrieved clinical RAG guidelines.
        Explain medical terms in simple, patient-friendly language. Always ground your facts in the clinical guidelines.

        Retrieved Clinical Guidelines (RAG):
        {rag_context}

        Patient Details:
        {context}

        Patient Query: "{message}"
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                return f"Error executing Analysis Agent: {str(e)}"
        return "Analysis Agent: I cannot analyze reports without a Gemini API Key."

    def _run_tracking_agent(self, message: str, context: str, symptoms: list) -> str:
        """Tracking Agent: reports symptom trends and milestone accomplishments."""
        symptom_history = "\n".join([f"- {s.timestamp.strftime('%Y-%m-%d')}: Pain {s.pain_level}/10, Temp {s.temperature}C" for s in symptoms[:5]])
        prompt = f"""
        You are the Tracking Agent for AfterCare AI.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.). Do not answer in English if the user asked in another language.

        The patient is asking about their recovery progress, symptom trends, or vitals.
        Analyze their past log entries and give them encouraging feedback.
        
        Recent Symptom Logs:
        {symptom_history}

        Patient Details:
        {context}

        Patient Query: "{message}"
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                return f"Error executing Tracking Agent: {str(e)}"
        return "Tracking Agent: Vitals log indicates stable progression."

    def _run_medication_agent(self, message: str, context: str, medications: list) -> str:
        """Medication Agent: schedule management and warnings."""
        meds_details = "\n".join([f"- {m.name}: {m.dosage}, times: {m.times_of_day}, instructions: {m.instructions or 'Take as directed'}" for m in medications])
        prompt = f"""
        You are the Medication Agent for AfterCare AI.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.). Do not answer in English if the user asked in another language.

        Review their active medications, answer their questions, check if they missed a dose based on their query, and provide safety instructions.
        Include standard safety warning: 'Do not adjust your prescription without consulting your cardiologist or surgeon.'

        Active Medications:
        {meds_details}

        Patient Details:
        {context}

        Patient Query: "{message}"
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                return f"Error executing Medication Agent: {str(e)}"
        return "Medication Agent: Please check your prescription bottle for dosing details."

    def _run_nutrition_agent(self, message: str, context: str, surgery_type: str) -> str:
        """Nutrition Agent: personalized post-operative recovery nutrition."""
        rag_context = rag_service.search("diet food nutrition " + surgery_type, top_k=1)
        prompt = f"""
        You are the Recovery Nutrition Agent for AfterCare AI.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.). Do not answer in English if the user asked in another language.

        Generate personalized post-operative dietary advice based on the surgery type: {surgery_type}.
        Specify:
        - Foods to eat (promotes wound healing and low strain)
        - Foods to avoid
        - Hydration advice
        - Protein recommendation for tissue repair
        
        RAG Diet Reference:
        {rag_context}

        Patient Details:
        {context}

        Patient Query: "{message}"
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                return f"Error executing Nutrition Agent: {str(e)}"
        return "Nutrition Agent: Ensure you stay hydrated and eat soft, low-fat protein foods like chicken or fish."

    def _run_appointment_agent(self, message: str, context: str, appointments: list) -> str:
        """Appointment Agent: schedules and follow-up warnings."""
        prompt = f"""
        You are the Appointment Agent for AfterCare AI.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.). Do not answer in English if the user asked in another language.

        Answer the patient's questions about upcoming visits, diagnostic tests, or scheduling.
        Remind them of the importance of follow-ups in preventing readmissions.

        Patient Details:
        {context}

        Patient Query: "{message}"
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                return f"Error executing Appointment Agent: {str(e)}"
        return "Appointment Agent: You have follow-ups scheduled. Please attend all visits."

    def _run_general_agent(self, message: str, context: str, history: str) -> str:
        """General chatbot fallback."""
        prompt = f"""
        You are AfterCare AI's central health companion.
        CRITICAL LANGUAGE DIRECTIVE: Detect the language of the user query. ALWAYS answer in the EXACT SAME LANGUAGE that the user used (e.g. Hindi, Spanish, French, German, Marathi, etc.). Do not answer in English if the user asked in another language.

        Help the patient with general questions, greet them, or provide support.
        Keep it warm, professional, and health-focused.

        Patient Context:
        {context}

        Recent History:
        {history}

        Patient Query: "{message}"
        """
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text
            except Exception as e:
                return f"Error executing general assistant: {str(e)}"
        return "Hello. How can I help you in your recovery today?"

agent_orchestrator = AgentOrchestrator()
