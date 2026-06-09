import time
from decimal import Decimal, ROUND_HALF_UP

import httpx

FRANKFURTER_API = "https://api.frankfurter.dev"
ER_API = "https://open.er-api.com/v6/latest/USD"
CACHE_TTL_SECONDS = 3600

_rate_cache: dict[tuple[str, str], tuple[Decimal, float]] = {}


def _quantize(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _fetch_frankfurter(from_ccy: str, to_ccy: str) -> Decimal:
    url = f"{FRANKFURTER_API}/v2/rate/{from_ccy}/{to_ccy}"
    response = httpx.get(url, timeout=10.0)
    response.raise_for_status()
    data = response.json()
    rate = data.get("rate")
    if rate is None:
        raise ValueError(f"No Frankfurter rate for {from_ccy} → {to_ccy}")
    return Decimal(str(rate))


def _fetch_er_api(from_ccy: str, to_ccy: str) -> Decimal:
    response = httpx.get(ER_API, timeout=10.0)
    response.raise_for_status()
    data = response.json()
    if data.get("result") != "success":
        raise ValueError("Exchange rate fallback returned an error")
    rates = data.get("rates") or {}
    from_rate = rates.get(from_ccy)
    to_rate = rates.get(to_ccy)
    if from_rate is None or to_rate is None:
        raise ValueError(f"No fallback rate for {from_ccy} → {to_ccy}")
    return Decimal(str(to_rate)) / Decimal(str(from_rate))


def get_exchange_rate(from_ccy: str, to_ccy: str) -> Decimal:
    """Return multiplier to convert `from_ccy` amount into `to_ccy`."""
    from_ccy = from_ccy.upper()
    to_ccy = to_ccy.upper()
    if from_ccy == to_ccy:
        return Decimal("1")

    cache_key = (from_ccy, to_ccy)
    now = time.time()
    cached = _rate_cache.get(cache_key)
    if cached and now < cached[1]:
        return cached[0]

    try:
        rate = _fetch_frankfurter(from_ccy, to_ccy)
    except Exception:
        rate = _fetch_er_api(from_ccy, to_ccy)

    _rate_cache[cache_key] = (rate, now + CACHE_TTL_SECONDS)
    return rate


def convert_amount(amount: Decimal, from_ccy: str, to_ccy: str) -> Decimal:
    rate = get_exchange_rate(from_ccy, to_ccy)
    return _quantize(amount * rate)
