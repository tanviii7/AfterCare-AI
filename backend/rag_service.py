import numpy as np
import json
import os
from typing import List, Dict
from google import genai
from backend.config import settings

# In-memory storage for guidelines
GUIDELINES: List[Dict[str, str]] = [
    {
        "category": "cardiology",
        "title": "Post-Coronary Artery Bypass Graft (CABG) & Valve Surgery Care",
        "content": "Activity Restrictions: Do not lift anything over 10 lbs (4.5 kg) for the first 6-8 weeks to allow the sternum (breastbone) to heal. Avoid pushing, pulling, or sudden twisting of the upper body. No driving until approved by your cardiologist.\n"
                   "Wound Care: Keep chest and leg incisions clean and dry. Wash gently with mild soap and warm water; pat dry. Do not apply ointments, powders, or lotions. Monitor for signs of sternal instability (clicking/grating sensation in the breastbone).\n"
                   "Vitals & Warnings: Track your blood pressure, heart rate, and weight daily. Report a weight gain of 2 lbs (0.9 kg) in 24 hours or 5 lbs (2.3 kg) in a week, as this may indicate fluid retention. Call emergency immediately for chest pain, pressure, or sudden shortness of breath.\n"
                   "Medications: Take beta-blockers (e.g., Metoprolol) and blood thinners (e.g., Aspirin, Clopidogrel) exactly as prescribed. Do not miss doses."
    },
    {
        "category": "orthopedics",
        "title": "Total Knee & Hip Arthroplasty (Joint Replacement) Care",
        "content": "Activity & Physical Therapy: Walk daily using your assistive device (walker, crutches, or cane) as instructed. Perform home exercises 2-3 times daily. Keep the joint mobile but avoid extreme bending (hip flexion > 90 degrees for hip replacement).\n"
                   "Wound & Dressing Care: Keep the surgical site clean. If you have staples or sutures, keep the area dry until they are removed. Watch for signs of infection: increased redness, warmth, swelling, or drainage.\n"
                   "Pain Management: Take pain medications 30-45 minutes before starting physical therapy. Use ice packs for 15-20 minutes at a time to reduce swelling and pain.\n"
                   "Deep Vein Thrombosis (DVT) Prevention: Take blood thinners (e.g., Apixaban, Aspirin) as prescribed. Wear compression stockings (TED hose) if instructed. Monitor for sudden calf pain, swelling, redness, or shortness of breath (signs of pulmonary embolism)."
    },
    {
        "category": "general_surgery",
        "title": "Abdominal Surgery (Appendectomy, Cholecystectomy, Hernia Repair) Care",
        "content": "Lifting & Strain: Do not lift anything over 15 lbs (7 kg) for 4-6 weeks to prevent hernia formation at the incision sites. Avoid strenuous exercise, core-heavy movements, and straining during bowel movements.\n"
                   "Incision Care: Incisions may be closed with steri-strips, glue, or sutures. Steri-strips will fall off on their own in 7-10 days. Wash the area gently; do not scrub. Keep dressing dry for the first 48 hours.\n"
                   "Dietary Transitions: Start with clear liquids (broth, tea) and transition slowly to low-fat, low-fiber soft foods (rice, bananas, toast, applesauce). Avoid carbonated beverages, greasy/fatty foods, and heavy meals to prevent bloating and nausea.\n"
                   "Constipation Prevention: Take a stool softener (e.g., Docusate Sodium) daily while taking opioid pain medications, as they cause severe constipation. Drink plenty of water and eat high-fiber foods once tolerated."
    },
    {
        "category": "general",
        "title": "General Post-Hospital Discharge Instruction Guide",
        "content": "Infection Warning Signs: Take your temperature daily. Contact your care provider immediately if you experience a fever of 100.4F (38C) or higher, chills, worsening pain not relieved by medication, or foul-smelling drainage from the surgical site.\n"
                   "Hydration & Energy: Drink at least 8-10 glasses of water daily unless restricted by your doctor (e.g., for heart failure patients). Rest frequently throughout the day; do not push through severe fatigue.\n"
                   "Emergency Protocols: For severe bleeding that does not stop with direct pressure, sudden difficulty breathing, chest pain, or loss of consciousness, call 911 or visit the nearest emergency department immediately."
    }
]

# We will cache the embeddings locally in a JSON file to avoid re-embedding on every search
EMBEDDINGS_CACHE_FILE = os.path.join(os.path.dirname(__file__), "guidelines_embeddings.json")

class RAGService:
    def __init__(self):
        self.embeddings = []
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                self.load_or_create_embeddings()
            except Exception as e:
                print(f"RAGService init error: {e}")

    def load_or_create_embeddings(self):
        if not self.client:
            return

        if os.path.exists(EMBEDDINGS_CACHE_FILE):
            try:
                with open(EMBEDDINGS_CACHE_FILE, "r") as f:
                    self.embeddings = json.load(f)
                    if len(self.embeddings) == len(GUIDELINES):
                        return
            except Exception:
                pass

        # Create embeddings
        self.embeddings = []
        for doc in GUIDELINES:
            try:
                # Truncate content if too long for embedding (text-embedding-004 supports up to 2048 tokens, our docs are small)
                response = self.client.models.embed_content(
                    model="text-embedding-004",
                    contents=doc["content"]
                )
                embedding_vector = response.embeddings[0].values
                self.embeddings.append({
                    "category": doc["category"],
                    "title": doc["title"],
                    "content": doc["content"],
                    "vector": embedding_vector
                })
            except Exception as e:
                print(f"Error embedding doc: {doc['title']} - {e}")

        # Save cache
        try:
            with open(EMBEDDINGS_CACHE_FILE, "w") as f:
                json.dump(self.embeddings, f)
        except Exception as e:
            print(f"Error writing embedding cache: {e}")

    def search(self, query: str, category: str = None, top_k: int = 1) -> str:
        """Retrieves relevant guidelines matching the query using cosine similarity."""
        if not self.client or not self.embeddings:
            # Fallback keyword match if API client or embeddings are unavailable
            results = []
            for doc in GUIDELINES:
                if category and doc["category"] != category:
                    continue
                # Simple score based on term matches
                score = sum(1 for word in query.lower().split() if word in doc["content"].lower() or word in doc["title"].lower())
                results.append((score, doc))
            results.sort(key=lambda x: x[0], reverse=True)
            return "\n\n".join([f"Source: {doc['title']}\n{doc['content']}" for score, doc in results[:top_k]])

        try:
            # Embed query
            response = self.client.models.embed_content(
                model="text-embedding-004",
                contents=query
            )
            query_vector = np.array(response.embeddings[0].values)

            # Calculate cosine similarities
            scored_docs = []
            for doc in self.embeddings:
                if category and doc["category"] != category:
                    continue
                doc_vector = np.array(doc["vector"])
                # Cosine similarity
                dot_product = np.dot(query_vector, doc_vector)
                norm_q = np.linalg.norm(query_vector)
                norm_d = np.linalg.norm(doc_vector)
                similarity = dot_product / (norm_q * norm_d) if (norm_q > 0 and norm_d > 0) else 0.0
                scored_docs.append((similarity, doc))

            # Sort by similarity descending
            scored_docs.sort(key=lambda x: x[0], reverse=True)
            
            # Format outputs
            retrieved = []
            for score, doc in scored_docs[:top_k]:
                retrieved.append(f"Source: {doc['title']} (Relevance: {score:.2f})\n{doc['content']}")
            return "\n\n".join(retrieved)

        except Exception as e:
            print(f"Search RAG error: {e}")
            # Final fallback
            return "\n\n".join([f"Source: {doc['title']}\n{doc['content']}" for doc in GUIDELINES if not category or doc["category"] == category][:top_k])

rag_service = RAGService()
