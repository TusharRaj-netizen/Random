"""Gemini-powered AI chat service with a senior-safe rule-based fallback.

The service always returns a helpful response. When a Gemini API key is
configured it grounds the model on the Jan-Aushadhi catalogue and a strict
senior-safety system prompt. When no key is available it falls back to a
deterministic rule-based assistant so the application remains fully usable.
"""

from __future__ import annotations

from typing import List

from app.config import settings
from app.schemas import ChatMessage, ChatSource
from app.services import janaushadhi

# ---------------------------------------------------------------------------
# Safety / system prompt
# ---------------------------------------------------------------------------
DISCLAIMER = (
    "यह जानकारी केवल सहायता के लिए है और डॉक्टर की सलाह का विकल्प नहीं है। "
    "किसी भी दवा या उपचार से पहले अपने चिकित्सक से जरूर परामर्श करें।"
)

DISCLAIMER_EN = (
    "This information is for support only and is not a substitute for a doctor's "
    "advice. Always consult your physician before starting, stopping or changing "
    "any medicine or treatment."
)

SYSTEM_PROMPT = """You are Vridh-Mitra (वृद्ध-मित्र), a friendly, patient and respectful
healthcare copilot designed for Indian senior citizens. You help them understand
Jan-Aushadhi generic medicines, manage daily medication, and answer everyday
health questions in a calm, simple, clear way.

Rules you must always follow:
1. Speak in simple words and short sentences. Avoid medical jargon. The user is
   likely aged 60+ and may not be technically fluent.
2. Respond in the language the user prefers: English, Hindi (Devanagari) or
   Hinglish (Roman Hindi). If unsure, mirror the user's last message.
3. You are NOT a doctor. Never diagnose, never prescribe, never recommend doses
   for new medicines, and never tell a user to stop a prescribed medicine.
4. Always include a gentle reminder to consult a doctor for diagnosis or
   treatment decisions.
5. When the user asks about a medicine that exists in the Jan-Aushadhi catalogue
   provided in context, share its generic name, what it is used for, the
   Jan-Aushadhi price vs branded price, and key precautions.
6. If a question describes an emergency (chest pain, stroke signs, severe
   breathing trouble, heavy bleeding, unconsciousness, sudden vision/speech loss),
   immediately tell them to call 112 (Indian emergency number) or go to the
   nearest hospital. Do this before anything else.
7. Be warm, respectful and encouraging. Address the user affectionately but
   professionally. Use phrases like "जी" or "please take care".
8. Keep replies concise (3-7 short points or a few sentences) unless asked for
   detail. Use bullet points for medicine info.
"""

EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "stroke", "unconscious", "fainted", "fainting",
    "can't breathe", "cannot breathe", "breathing problem severe", "heavy bleeding",
    "severe bleeding", "not breathing", "seizure", "convulsion", "paralysis",
    "छाती में दर्द", "सांस नहीं", "बेहोश", "लकवा", "जान जोखे",
]

# Token pairs that, when both present, indicate a likely emergency even if the
# exact phrase is split by other words (common in Hindi/Hinglish sentences).
EMERGENCY_TOKEN_PAIRS = [
    ({"छाती", "chest"}, {"दर्द", "pain"}),
    ({"सांस", "saans", "breath", "breathing"}, {"नहीं", "तेज़", "problem", "नहीं ले", "can't", "cannot"}),
    ({"दिल", "heart"}, {"दर्द", "pain", "attack"}),
]


def _is_emergency(text: str) -> bool:
    lowered = text.lower()
    if any(keyword in lowered for keyword in EMERGENCY_KEYWORDS):
        return True
    tokens = set(lowered.replace("।", " ").split())
    for left, right in EMERGENCY_TOKEN_PAIRS:
        if left & tokens and right & tokens:
            return True
    return False


def _emergency_reply(language: str) -> str:
    if language == "hi":
        return (
            "⚠️ यह आपातकालीन स्थिति जैसी लगती है।\n"
            "कृपया तुरंत 112 पर कॉल करें या नजदीकी अस्पताल जाएँ।\n"
            "ज़रूरी कदम:\n"
            "• घबराएँ नहीं, शांत रहें\n"
            "• यदि संभव हो तो बैठ या लेट जाएँ\n"
            "• किसी परिजन को सूचित करें\n"
            "• दवा खुद न दें, डॉक्टर की सलाह लें\n\n"
            f"{DISCLAIMER}"
        )
    return (
        "⚠️ This sounds like an emergency.\n"
        "Please call 112 immediately or go to the nearest hospital.\n"
        "Important steps:\n"
        "• Do not panic, stay calm\n"
        "• Sit or lie down if possible\n"
        "• Inform a family member\n"
        "• Do not take medicine on your own; follow a doctor's advice\n\n"
        f"{DISCLAIMER_EN}"
    )


# ---------------------------------------------------------------------------
# Gemini integration
# ---------------------------------------------------------------------------
def _to_gemini_history(history: List[ChatMessage]) -> List[dict]:
    """Convert chat history to the google-genai ``Content`` format."""
    return [{"role": msg.role.value, "parts": [msg.content]} for msg in history]


def _generate_with_gemini(message: str, history: List[ChatMessage], language: str) -> str:
    """Call the Gemini model. Raises on any failure so the caller can fall back."""
    from google import genai  # imported lazily to keep startup light
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    catalogue = janaushadhi.build_catalogue_context()
    system_instruction = (
        SYSTEM_PROMPT
        + f"\n\nPreferred reply language: {language}.\n"
        + "Jan-Aushadhi catalogue reference:\n"
        + catalogue
    )

    contents = _to_gemini_history(history)
    contents.append({"role": "user", "parts": [message]})

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.4,
        max_output_tokens=800,
        safety_settings=[
            types.SafetySetting(
                category="HARM_CATEGORY_HARASSMENT",
                threshold="BLOCK_ONLY_HIGH",
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold="BLOCK_ONLY_HIGH",
            ),
        ],
    )
    response = client.models.generate_content(
        model=settings.gemini_model, contents=contents, config=config
    )
    text = getattr(response, "text", None)
    if not text:
        try:
            text = response.candidates[0].content.parts[0].text
        except Exception:  # pragma: no cover - defensive
            text = ""
    return text.strip()


# ---------------------------------------------------------------------------
# Rule-based fallback assistant
# ---------------------------------------------------------------------------
_MED_INTRO = {
    "en": "Here is what I found about {name} ({hindi}) from the Jan-Aushadhi range:",
    "hi": "जन औषधि से {name} ({hindi}) के बारे में जानकारी:",
}


def _medicine_reply(medicine, language: str) -> str:
    savings = medicine.branded_price_inr - medicine.jan_aushadhi_price_inr
    pct = round(savings / medicine.branded_price_inr * 100, 1)
    intro = _MED_INTRO.get(language, _MED_INTRO["en"]).format(
        name=medicine.generic_name, hindi=medicine.hindi_name
    )
    if language == "hi":
        return (
            f"{intro}\n\n"
            f"• उपयोग: {medicine.indication}\n"
            f"• रूप: {medicine.dosage_form} ({medicine.strength})\n"
            f"• जन औषधि मूल्य: ₹{medicine.jan_aushadhi_price_inr:g}\n"
            f"• ब्रांडेड मूल्य: ₹{medicine.branded_price_inr:g} (₹{savings:g} यानी {pct}% बचत)\n"
            f"• सावधानियाँ: {medicine.precautions}\n\n"
            f"यह जानकारी आपकी सहायता के लिए है। कृपया दवा शुरू करने से पहले डॉक्टर से परामर्श लें।"
        )
    return (
        f"{intro}\n\n"
        f"• Use: {medicine.indication}\n"
        f"• Form: {medicine.dosage_form} ({medicine.strength})\n"
        f"• Jan Aushadhi price: ₹{medicine.jan_aushadhi_price_inr:g}\n"
        f"• Branded price: ₹{medicine.branded_price_inr:g} (save ₹{savings:g}, {pct}%)\n"
        f"• Precautions: {medicine.precautions}\n\n"
        f"{DISCLAIMER_EN}"
    )


_FALLBANK = {
    "en": {
        "greeting": (
            "Namaste! 🙏 I am Vridh-Mitra, your friendly health companion. "
            "I can help you find affordable Jan-Aushadhi medicines, understand "
            "what they are for, set medicine reminders, and answer simple health "
            "questions. What would you like to know?"
        ),
        "price": (
            "Jan-Aushadhi stores sell good-quality generic medicines at much "
            "lower prices than branded ones — often 50% to 90% cheaper. "
            "You can search for a medicine in the Medicines tab to see the exact "
            "price difference. Would you like me to look up a specific medicine?"
        ),
        "store": (
            "Jan-Aushadhi Kendras (PMBJP stores) are present across India. "
            "You can find your nearest store at janaushadhi.gov.in or by calling "
            "the toll-free helpline 1800-180-1500 (Janaushadhi Helpline)."
        ),
        "reminder": (
            "To add a medicine reminder, open the Reminders tab and tap 'Add "
            "Reminder'. You can set the medicine name, dosage and time. I will "
            "remind you when it is time to take your medicine."
        ),
        "diet": (
            "For healthy senior years, eat plenty of vegetables, fruits, whole "
            "grains and lentils (dal); limit salt, sugar and fried food; drink "
            "6-8 glasses of water; and try a short daily walk. Please consult "
            "your doctor for a diet plan suited to your conditions."
        ),
        "default": (
            "I understand. I can help with Jan-Aushadhi medicines, medicine "
            "reminders, prices, and general senior health tips. Could you tell "
            "me a little more, or try searching the Medicines tab? Remember, for "
            "diagnosis or treatment always consult your doctor."
        ),
    },
    "hi": {
        "greeting": (
            "नमस्ते! 🙏 मैं वृद्ध-मित्र हूँ, आपका स्वास्थ्य साथी। मैं जन औषधि की किफ़ायती "
            "दवाएँ खोजने, उनके उपयोग को समझने, दवा रिमाइंडर सेट करने और आसान स्वास्थ्य "
            "सवालों के जवाब देने में मदद कर सकता हूँ। आप क्या जानना चाहेंगे?"
        ),
        "price": (
            "जन औषधि केंद्रों पर अच्छी क्वालिटी की जेनेरिक दवाएँ ब्रांडेड दवाओं से बहुत सस्ती "
            "मिलती हैं — अक्सर 50% से 90% कम दाम पर। विस्तार से जानने के लिए Medicines "
            "टैब में दवा खोजें। क्या कोई विशेष दवा देखें?"
        ),
        "store": (
            "जन औषधि केंद्र (PMBJP स्टोर) पूरे भारत में हैं। नजदीकी स्टोर janaushadhi.gov.in "
            "पर या टोल-फ्री हेल्पलाइन 1800-180-1500 पर पता कर सकते हैं।"
        ),
        "reminder": (
            "दवा रिमाइंडर जोड़ने के लिए Reminders टैब खोलें और 'Add Reminder' दबाएँ। "
            "दवा का नाम, मात्रा और समय डालें — मैं समय पर याद दिलाऊँगा।"
        ),
        "diet": (
            "सेहतमंद बुढ़ापे के लिए ज्यादा सब्ज़ी, फल, अनाज और दाल खाएँ; नमक, चीनी और तले "
            "तेल कम करें; 6-8 गिलास पानी पिएँ; और रोज़ थोड़ी टहलें। अपनी बीमारी के अनुसार "
            "आहार योजना के लिए डॉक्टर से जरूर परामर्श लें।"
        ),
        "default": (
            "मैं समझ गया। मैं जन औषधि दवाओं, रिमाइंडर, दाम और सामान्य स्वास्थ्य सुझावों में "
            "मदद कर सकता हूँ। थोड़ा और बताएँ या Medicines टैब देखें। निदान या इलाज के लिए "
            "हमेशा डॉक्टर से सलाह लें।"
        ),
    },
}


def _fallback_reply(message: str, language: str) -> tuple[str, List[ChatSource]]:
    """Deterministic assistant used when Gemini is unavailable."""
    text = message.lower()
    sources: List[ChatSource] = []

    matched = janaushadhi.search_medicines(message, limit=1)
    if matched:
        sources.append(
            ChatSource(title=f"Jan-Aushadhi: {matched[0].generic_name}", type="medicine")
        )
        return _medicine_reply(matched[0], language), sources

    lang = "hi" if language == "hi" else "en"
    bank = _FALLBANK[lang]

    if any(w in text for w in ["namaste", "namaskar", "hello", "hi ", "नमस्ते", "प्रणाम"]):
        return bank["greeting"], sources
    if any(w in text for w in ["price", "cost", "cheap", "दाम", "मूल्य", "सस्ती", "किफायत"]):
        return bank["price"], sources
    if any(w in text for w in ["store", "kendra", "shop", "where", "स्टोर", "केंद्र", "कहाँ"]):
        return bank["store"], sources
    if any(w in text for w in ["reminder", "remember", "schedule", "रिमाइंडर", "याद", "समय"]):
        return bank["reminder"], sources
    if any(w in text for w in ["diet", "food", "eat", "nutrition", "आहार", "खाना", "सेहत"]):
        return bank["diet"], sources
    return bank["default"], sources


def generate_reply(
    message: str,
    history: List[ChatMessage],
    language: str = "en",
    user_profile=None,
) -> tuple[str, List[ChatSource]]:
    """Generate a safe chat reply, preferring Gemini with a rule-based fallback."""
    sources: List[ChatSource] = []

    if _is_emergency(message):
        return _emergency_reply(language), sources

    if settings.gemini_available:
        try:
            reply = _generate_with_gemini(message, history, language)
            if reply:
                matched = janaushadhi.search_medicines(message, limit=1)
                if matched:
                    sources.append(
                        ChatSource(
                            title=f"Jan-Aushadhi: {matched[0].generic_name}",
                            type="medicine",
                        )
                    )
                return reply, sources
        except Exception:
            pass

    reply, sources = _fallback_reply(message, language)
    return reply, sources


__all__ = ["generate_reply", "DISCLAIMER", "DISCLAIMER_EN"]