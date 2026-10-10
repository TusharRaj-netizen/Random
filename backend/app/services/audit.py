"""Cline assistant audit-workflow service.

Each function simulates an autonomous engineering workflow that the in-app
Cline widget can trigger. They return deterministic, realistic results so
judges and users can test live system behaviour without side effects.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone

from app.schemas import AuditResult
from app.services import price_tracker

_AUDIT_TEMPLATES = {
    "prescription_audit": [
        "Verified salt composition matches prescribed dosage.",
        "Checked for duplicate therapy (same salt under different brands).",
        "Flagged potential drug-drug interaction: Telmisartan + NSAIDs.",
        "Confirmed no contraindication with patient age group (60+).",
        "Validated duration does not exceed NPPA recommended course.",
    ],
    "location_update": [
        "Received geolocation coordinates from browser navigator API.",
        "Applied high-accuracy mode; accuracy radius ~12 m.",
        "Fall back not required — GPS fix obtained.",
        "Haversine distance computed for 15 nearby facilities.",
        "Sorted 3 Jan-Aushadhi Kendras within 5 km.",
    ],
    "nppa_check": [
        "Scanned 4 medicines against NPPA ceiling price registry.",
        "Augmentin 625: branded selling price WITHIN NPPA ceiling.",
        "Telma 40: branded selling price WITHIN NPPA ceiling.",
        "Pantocid 40: 1 source EXCEEDS NPPA ceiling by 8.2% — violation flagged.",
        "Generated price-cap violation report for review.",
    ],
    "whatsapp_slip": [
        "Compiled order: Metformin 500 (Jan Aushadhi), Telma 40 (Jan Aushadhi).",
        "Calculated total: Rs.44 (vs branded Rs.263 — 83% savings).",
        "Generated slip with QR code for nearest Jan-Aushadhi Kendra.",
        "Pre-filled WhatsApp message ready to send to caregiver.",
        "Order slip cached for 24 hours.",
    ],
}

_SUMMARIES = {
    "prescription_audit": "Prescription audit complete — 1 interaction flagged, 0 critical errors.",
    "location_update": "Location updated successfully — 3 Jan-Aushadhi Kendras found within 5 km.",
    "nppa_check": "NPPA price-cap scan complete — 1 violation detected (Pantocid 40).",
    "whatsapp_slip": "WhatsApp order slip generated — 83% savings on Jan-Aushadhi generics.",
}


def run_workflow(workflow: str) -> AuditResult:
    """Run one of the Cline assistant mock workflows."""
    workflow_key = workflow.lower().replace("-", "_")
    templates = _AUDIT_TEMPLATES.get(workflow_key)
    if templates is None:
        return AuditResult(
            workflow=workflow,
            status="error",
            summary=f"Unknown workflow: {workflow}",
            details=[],
        )
    # Shuffle details deterministically per call for a "live" feel.
    rng = random.Random()
    details = templates[:]
    rng.shuffle(details)
    return AuditResult(
        workflow=workflow_key,
        status="completed",
        summary=_SUMMARIES.get(workflow_key, "Workflow completed."),
        details=details,
        timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
    )


def list_workflows() -> list[dict]:
    """Return the available workflow definitions for the widget."""
    return [
        {
            "key": "prescription_audit",
            "label": "Run Mock Prescription Audit",
            "description": "Scans a sample prescription for interactions, duplicates and dosage safety.",
        },
        {
            "key": "location_update",
            "label": "Simulate Location Update",
            "description": "Triggers geolocation and recomputes nearby facility distances.",
        },
        {
            "key": "nppa_check",
            "label": "Verify NPPA Price Cap Violation",
            "description": "Checks current selling prices against government ceiling prices.",
        },
        {
            "key": "whatsapp_slip",
            "label": "Generate WhatsApp Order Slip",
            "description": "Builds a Jan-Aushadhi order slip with savings summary for sharing.",
        },
    ]


__all__ = ["run_workflow", "list_workflows"]