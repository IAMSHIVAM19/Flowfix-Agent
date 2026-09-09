from sqlalchemy import select

from ..models_db import Service


SERVICE_ALIASES = {
    # --------------------------------------------------------
    # TAP / FAUCET
    # --------------------------------------------------------

    "tap repair": "tap repair",
    "faucet repair": "tap repair",
    "leaking tap repair": "tap repair",
    "tap/faucet repair": "tap repair",
    "leaking kitchen tap": "tap repair",
    "fix leaking kitchen tap": "tap repair",
    "kitchen tap leak": "tap repair",
    "kitchen tap leaking": "tap repair",
    "leaking tap": "tap repair",
    "tap leaking": "tap repair",
    "broken tap": "tap repair",
    "broken faucet": "tap repair",
    "fix tap": "tap repair",
    "tap needs repair": "tap repair",
    "faucet leaking": "tap repair",
    "leaking faucet": "tap repair",
    "fix faucet": "tap repair",
    "broken faucet": "tap repair",
    "sink": "tap repair",
    "sink repair": "tap repair",
    "blocked sink": "tap repair",
    "sink blocked": "tap repair",
    "clogged sink": "tap repair",
    "sink clogged": "tap repair",
    "kitchen sink": "tap repair",
    "bathroom sink": "tap repair",
    "basin": "tap repair",
    "basin repair": "tap repair",
    "drain": "tap repair",

    # --------------------------------------------------------
    # TOILET
    # --------------------------------------------------------

    "toilet repair": "toilet repair",
    "toilet fix": "toilet repair",
    "fix toilet": "toilet repair",
    "broken toilet": "toilet repair",
    "leaking toilet": "toilet repair",
    "blocked toilet": "toilet repair",
    "clogged toilet": "toilet repair",

    # --------------------------------------------------------
    # SHOWER
    # --------------------------------------------------------

    "shower repair": "shower repair",
    "shower fix": "shower repair",
    "fix shower": "shower repair",
    "broken shower": "shower repair",
    "leaking shower": "shower repair",
    "shower leak": "shower repair",
    "blocked shower": "shower repair",
    "shower blocked": "shower repair",
    "shower drain": "shower repair",

    # --------------------------------------------------------
    # BLOCKED DRAINS / SEWER
    # --------------------------------------------------------

    "blocked drains": "blocked drains",
    "blocked drain": "blocked drains",
    "clogged drain": "blocked drains",
    "drain clearing": "blocked drains",
    "drain unblocking": "blocked drains",
    "sewer blockage": "blocked drains",
    "blocked sewer": "blocked drains",
    "cctv drain inspection": "blocked drains",
    "hydro jetting": "blocked drains",
    "stormwater drain": "blocked drains",
    "drainage": "blocked drains",

    # --------------------------------------------------------
    # HOT WATER SYSTEM
    # --------------------------------------------------------

    "hot water system": "hot water system",
    "hot water": "hot water system",
    "no hot water": "hot water system",
    "water heater": "hot water system",
    "water heater leak": "hot water system",
    "hot water heater": "hot water system",
    "hot water cylinder": "hot water system",
    "gas hot water": "hot water system",
    "electric hot water": "hot water system",
    "heat pump hot water": "hot water system",
    "tempering valve": "hot water system",
    "hot water repair": "hot water system",

    # --------------------------------------------------------
    # BURST PIPE REPAIR
    # --------------------------------------------------------

    "burst pipe repair": "burst pipe repair",
    "burst pipe": "burst pipe repair",
    "pipe burst": "burst pipe repair",
    "broken pipe": "burst pipe repair",
    "cracked pipe": "burst pipe repair",
    "blown pipe": "burst pipe repair",
    "main line burst": "burst pipe repair",
    "water main burst": "burst pipe repair",

    # --------------------------------------------------------
    # GAS FITTING
    # --------------------------------------------------------

    "gas fitting": "gas fitting",
    "gas leak": "gas fitting",
    "gas leak detection": "gas fitting",
    "gas smell": "gas fitting",
    "smell gas": "gas fitting",
    "gas appliance": "gas fitting",
    "gas cooktop": "gas fitting",
    "gas heater": "gas fitting",
    "gas line": "gas fitting",
    "lpg": "gas fitting",

    # --------------------------------------------------------
    # ROOF PLUMBING
    # --------------------------------------------------------

    "roof plumbing": "roof plumbing",
    "roof leak": "roof plumbing",
    "leaking roof": "roof plumbing",
    "gutter repair": "roof plumbing",
    "blocked gutter": "roof plumbing",
    "gutter replacement": "roof plumbing",
    "downpipe": "roof plumbing",
    "box gutter": "roof plumbing",
    "roof flashing": "roof plumbing",

    # --------------------------------------------------------
    # BACKFLOW PREVENTION
    # --------------------------------------------------------

    "backflow prevention": "backflow prevention",
    "backflow": "backflow prevention",
    "backflow test": "backflow prevention",
    "backflow testing": "backflow prevention",
    "rpz valve": "backflow prevention",
    "backflow device": "backflow prevention",
    "annual backflow": "backflow prevention",

    # --------------------------------------------------------
    # GENERAL LEAK INVESTIGATION
    # --------------------------------------------------------

    "leak investigation": "leak investigation",
    "leak repair": "leak investigation",
    "general leak": "leak investigation",
    "unexplained leak": "leak investigation",
    "major leak": "leak investigation",
    "severe leak": "leak investigation",
    "water leak": "leak investigation",
    "pipe leak": "leak investigation",
    "leaking pipe": "leak investigation",
    "low pressure": "leak investigation",
    "flooding": "leak investigation",
    "ceiling leak": "leak investigation",

    # --------------------------------------------------------
    # AMBIGUOUS
    # --------------------------------------------------------

    "plumbing": None,
}



def normalize_service_name(
    service_name: str | None,
) -> str | None:
    if service_name is None:
        return None

    normalized = (
        service_name
        .strip()
        .lower()
    )

    if not normalized:
        return None

    # --------------------------------------------------------
    # Exact alias match
    # --------------------------------------------------------

    if normalized in SERVICE_ALIASES:
        return SERVICE_ALIASES[normalized]

    # --------------------------------------------------------
    # Phrase-based matching
    # --------------------------------------------------------

    normalized_words = set(
        normalized.replace(
            "/",
            " ",
        )
        .replace(
            "-",
            " ",
        )
        .split()
    )

    # Specific trade keywords
    gas_words = {"gas", "lpg"}
    backflow_words = {"backflow", "rpz"}
    roof_words = {"roof", "gutter", "gutters", "downpipe", "downpipes", "flashing"}
    hot_water_words = {"heater", "cylinder", "thermostat", "tempering"}
    burst_words = {"burst", "bursting"}
    drain_words = {"drain", "drains", "sewer", "sewage", "hydrojet", "jetting"}
    toilet_words = {"toilet", "cistern"}
    shower_words = {"shower"}
    tap_words = {"tap", "faucet", "sink", "basin", "spout", "vanity"}
    leak_words = {"leak", "leaking", "leaked", "flood", "flooding", "ceiling", "pressure", "dripping"}

    if normalized_words & gas_words:
        return "gas fitting"

    if normalized_words & backflow_words:
        return "backflow prevention"

    if normalized_words & roof_words:
        return "roof plumbing"

    if (normalized_words & hot_water_words) or ("hot" in normalized_words and "water" in normalized_words):
        return "hot water system"

    if normalized_words & burst_words:
        return "burst pipe repair"

    if normalized_words & drain_words:
        return "blocked drains"

    if normalized_words & toilet_words:
        return "toilet repair"

    if normalized_words & shower_words:
        return "shower repair"

    if normalized_words & tap_words:
        return "tap repair"

    if normalized_words & leak_words:
        return "leak investigation"

    return normalized



def get_service_by_name(
    db,
    service_name: str | None,
):
    normalized_name = normalize_service_name(
        service_name
    )

    if normalized_name is None:
        return None

    statement = select(Service).where(
        Service.name == normalized_name
    )

    return db.scalar(statement)