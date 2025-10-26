/**
 * Geocoding utilities för Svenska Bro App
 * Omvandlar GPS-koordinater till läsbara adresser
 */

export interface Address {
  country: string;
  city: string;
  road?: string;
  houseNumber?: string;
  suburb?: string;
  town?: string;
  village?: string;
  county?: string;
  displayName: string;
}

/**
 * Reverse geocoding: Omvandlar koordinater till adress
 * Använder OpenStreetMap Nominatim API (gratis, ingen API-nyckel krävs)
 */
export async function getAddressFromCoordinates(
  lat: number,
  lng: number
): Promise<Address | null> {
  // CRITICAL FIX: Validate coordinates before API call
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    console.error("❌ Geocoding error: lat or lng is undefined/null", { lat, lng });
    return null;
  }

  // CRITICAL FIX: Validate coordinates are valid numbers
  if (isNaN(lat) || isNaN(lng)) {
    console.error("❌ Geocoding error: lat or lng is not a number", { lat, lng });
    return null;
  }

  // CRITICAL FIX: Validate coordinates are within valid range
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.error("❌ Geocoding error: coordinates out of valid range", { lat, lng });
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=sv`,
      {
        headers: {
          'User-Agent': 'SvenskaBroApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }

    const address: Address = {
      country: data.address.country || "Sverige",
      city: data.address.city || data.address.town || data.address.village || data.address.municipality || "",
      road: data.address.road || data.address.highway || undefined,
      houseNumber: data.address.house_number || undefined,
      suburb: data.address.suburb || undefined,
      town: data.address.town || undefined,
      village: data.address.village || undefined,
      county: data.address.county || undefined,
      displayName: data.display_name || ""
    };

    return address;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Formaterar adressen för visning
 */
export function formatAddress(address: Address | null, showFullAddress: boolean = false): string {
  if (!address) return "";

  const parts: string[] = [];

  // Prioritera i ordning: väg + nummer, stad, kommun, land
  if (address.road) {
    if (address.houseNumber) {
      parts.push(`${address.road} ${address.houseNumber}`);
    } else {
      parts.push(address.road);
    }
  }

  // Stad/ort
  const location = address.city || address.town || address.village || address.suburb;
  if (location) {
    parts.push(location);
  }

  // Om det inte finns någon specifik adress, visa kommun eller län
  if (parts.length === 0 || showFullAddress) {
    if (address.county) {
      parts.push(address.county);
    }
  }

  // Land (valfritt vid fullständig adress)
  if (showFullAddress && address.country) {
    parts.push(address.country);
  }

  return parts.join(", ") || "Okänd plats";
}

/**
 * Kortare format för kompakt visning
 */
export function formatAddressShort(address: Address | null): string {
  if (!address) return "";

  // Prioritera: vägnummer > ort > kommun
  if (address.road) {
    return address.road;
  }

  const location = address.city || address.town || address.village;
  if (location) {
    return location;
  }

  if (address.county) {
    return address.county;
  }

  return "Okänd plats";
}
