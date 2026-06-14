"""
Shared timezone validation utility.

All code paths that accept a user-supplied IANA timezone string MUST use
``validate_timezone()`` to reject invalid or spoofed values.  This prevents
silent errors in display formatting, reminder emails, and any future
timezone-dependent feature.

The validator checks against ``zoneinfo.available_timezones()``, which is the
standard Python 3.9+ IANA database backed by the ``tzdata`` PyPI package on
platforms that lack a system zoneinfo database (e.g. Windows).
"""

from __future__ import annotations

import zoneinfo
from functools import lru_cache
from typing import FrozenSet


@lru_cache(maxsize=1)
def _known_timezones() -> FrozenSet[str]:
    """Return a frozen set of all valid IANA timezone identifiers."""
    return frozenset(zoneinfo.available_timezones())


def validate_timezone(value: str | None) -> str:
    """Validate and normalize an IANA timezone string.

    Args:
        value: The raw timezone string from user input (may be None).

    Returns:
        The validated timezone string (defaults to "UTC" when value is None
        or empty).

    Raises:
        ValueError: If the supplied timezone is not in the IANA database.
    """
    if not value:
        return "UTC"

    value = value.strip()

    if value not in _known_timezones():
        raise ValueError(
            f"Invalid IANA timezone '{value}'. "
            f"Use e.g. 'Europe/Madrid', 'America/New_York'."
        )

    return value
