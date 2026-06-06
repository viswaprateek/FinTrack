from datetime import date

from fastapi import HTTPException, status

_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


def format_period(start: date, end: date) -> str:
    """e.g. "Jun 1 – Jun 30, 2026" or "Jun 28 – Jul 4, 2026" across month boundaries."""
    start_label = f"{_MONTHS[start.month - 1]} {start.day}"
    if start.year != end.year:
        start_label += f", {start.year}"
    end_label = f"{_MONTHS[end.month - 1]} {end.day}, {end.year}"
    return f"{start_label} – {end_label}"


def parse_id(raw: str, *, label: str = "id") -> int:
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {label}: {raw!r}")


def not_found(label: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
