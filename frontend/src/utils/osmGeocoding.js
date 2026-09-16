/**
 * OpenStreetMap (OSM) Geocoding and Autocomplete Service
 * 100% Free, Open Source, and Requires Zero API Keys or Paid Accounts.
 * Powered by OpenStreetMap data via Photon & Nominatim.
 */

// Common street suffix abbreviations to expand for higher geocoding accuracy
function expandAbbreviations(text) {
  return text
    .replace(/\brd\b/gi, "road")
    .replace(/\bst\b/gi, "street")
    .replace(/\bave\b/gi, "avenue")
    .replace(/\bdr\b/gi, "drive")
    .replace(/\bct\b/gi, "court")
    .replace(/\bpl\b/gi, "place")
    .replace(/\bpde\b/gi, "parade")
    .replace(/\bcres\b/gi, "crescent")
    .replace(/\bln\b/gi, "lane")
    .replace(/\bhwy\b/gi, "highway");
}

/**
 * Parses user input to extract unit/house prefixes (e.g., "2/30", "Unit 4/12")
 */
function extractUnitPrefix(query) {
  const trimmed = query.trim();
  let cleanQuery = trimmed;
  let unitPrefix = "";

  const unitMatch = trimmed.match(
    /^((?:unit\s*\d+[a-z]?[\/,\s]+|\d+[\/]\d+[a-z]?\s+|\d+[a-z]?\s+))(.*)/i
  );

  if (unitMatch && unitMatch[2].trim().length >= 2) {
    unitPrefix = unitMatch[1].trim();
    cleanQuery = unitMatch[2].trim();
  }

  return { unitPrefix, cleanQuery };
}

/**
 * Autocomplete address search using OpenStreetMap (Photon + Nominatim fallback)
 * Biased towards Australia / NSW by default.
 */
export async function searchOpenStreetMap(
  query,
  { lat = -33.8688, lon = 151.2093, limit = 6 } = {}
) {
  const trimmed = query?.trim() || "";
  if (trimmed.length < 2) return [];

  const { unitPrefix, cleanQuery } = extractUnitPrefix(trimmed);
  const expandedQuery = expandAbbreviations(cleanQuery);

  // Strategy 1: Fast Photon autocomplete (Elasticsearch on OSM data, sub-50ms)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      expandedQuery
    )}&lat=${lat}&lon=${lon}&limit=${limit}`;

    const res = await fetch(photonUrl, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        return data.features.map((feat, index) => {
          const p = feat.properties || {};
          const street = p.street || p.name || cleanQuery;
          const num = p.housenumber ? `${p.housenumber} ` : "";
          const main = unitPrefix
            ? `${unitPrefix} ${street}`
            : `${num}${street}`.trim() || trimmed;

          const localityParts = [
            p.district || p.suburb || p.locality,
            p.city,
            p.state,
            p.postcode,
            p.country,
          ].filter(Boolean);

          const secondary = localityParts.join(", ");
          const full = secondary ? `${main}, ${secondary}` : main;

          return {
            placeId: `osm-photon-${p.osm_id || index}`,
            mainText: main,
            secondaryText: secondary,
            fullAddress: full,
            coordinates: feat.geometry?.coordinates || null,
          };
        });
      }
    }
  } catch (err) {
    console.warn("Photon autocomplete failed, attempting Nominatim:", err);
  }

  // Strategy 2: Official OpenStreetMap Nominatim Fallback
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&countrycodes=au&limit=${limit}`;

    const res = await fetch(nominatimUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FlowFix-Plumbing-Platform/1.0",
      },
    });

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        return results.map((item, index) => {
          const addr = item.address || {};
          const street = addr.road || item.name || trimmed;
          const num = addr.house_number ? `${addr.house_number} ` : "";
          const main = unitPrefix ? `${unitPrefix} ${street}` : `${num}${street}`.trim();

          const localityParts = [
            addr.suburb || addr.neighbourhood || addr.city_district,
            addr.city || addr.town || addr.municipality,
            addr.state,
            addr.postcode,
            addr.country,
          ].filter(Boolean);

          const secondary = localityParts.join(", ");
          const full = secondary ? `${main}, ${secondary}` : main;

          return {
            placeId: `osm-nom-${item.place_id || index}`,
            mainText: main,
            secondaryText: secondary,
            fullAddress: full,
            coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
          };
        });
      }
    }
  } catch (err) {
    console.warn("Nominatim fallback failed:", err);
  }

  return [];
}

/**
 * Reverse geocode coordinates to street address using OpenStreetMap
 */
export async function reverseGeocodeOpenStreetMap(lat, lon) {
  // Strategy 1: Nominatim Reverse (very rich address breakdown)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FlowFix-Plumbing-Platform/1.0",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || "";
        const num = addr.house_number ? `${addr.house_number} ` : "";
        const main = `${num}${street}`.trim() || data.name || "Current Location";

        const localityParts = [
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town,
          addr.state,
          addr.postcode,
          addr.country,
        ].filter(Boolean);

        const secondary = localityParts.join(", ");
        const full = secondary ? `${main}, ${secondary}` : main;

        return {
          fullAddress: full,
          mainText: main,
          secondaryText: secondary,
          coordinates: [lon, lat],
        };
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed, trying Photon:", err);
  }

  // Strategy 2: Photon Reverse
  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const p = data.features[0].properties || {};
        const street = p.street || p.name || "";
        const num = p.housenumber ? `${p.housenumber} ` : "";
        const main = `${num}${street}`.trim() || "Current Location";

        const localityParts = [
          p.district || p.suburb,
          p.city,
          p.state,
          p.postcode,
          p.country,
        ].filter(Boolean);

        const secondary = localityParts.join(", ");
        const full = secondary ? `${main}, ${secondary}` : main;

        return {
          fullAddress: full,
          mainText: main,
          secondaryText: secondary,
          coordinates: [lon, lat],
        };
      }
    }
  } catch (err) {
    console.warn("Photon reverse geocode failed:", err);
  }

  return null;
}
