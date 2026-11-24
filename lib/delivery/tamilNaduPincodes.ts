/**
 * Tamil Nadu Delivery & Pincode Validation Utilities
 * Strict validation enforcing delivery exclusively across all Tamil Nadu postal circles (60-64)
 * and strictly excluding Puducherry Union Territory enclave pincodes.
 */

export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar',
] as const;

export interface TamilNaduDeliveryZone {
  zoneName: string;
  pincode: string;
  district: string;
  state: 'Tamil Nadu';
  deliveryMethod: 'local_own' | 'courier_manual';
  deliveryFee: number;
  freeAbove: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface TamilNaduPincodeCheckResult {
  served: boolean;
  pincode: string;
  isPuducherry: boolean;
  isTamilNadu: boolean;
  message: string;
  zone?: TamilNaduDeliveryZone;
}

/**
 * Checks whether a 6-digit pincode belongs to the Union Territory of Puducherry (Pondicherry/Karaikal enclaves).
 * Ranges to exclude:
 * - 605001 to 605114 (Puducherry main city and surrounding sub-divisions)
 * - 605502 (Puducherry enclave)
 * - 607402 (Puducherry enclave)
 * - 609601 to 609609 (Karaikal region enclave)
 */
export function isPuducherryPincode(pincode: string | number): boolean {
  const code = typeof pincode === 'number' ? pincode : parseInt(String(pincode).trim().replace(/\D/g, ''), 10);
  if (isNaN(code)) return false;

  return (
    (code >= 605001 && code <= 605114) ||
    code === 605502 ||
    code === 607402 ||
    (code >= 609601 && code <= 609609)
  );
}

/**
 * Validates whether a pincode matches the Tamil Nadu 6-digit postal circle regex ^(60|61|62|63|64)\d{4}$
 */
export function isTamilNaduPincodeFormat(pincode: string): boolean {
  const clean = pincode.trim().replace(/\D/g, '');
  return /^(60|61|62|63|64)\d{4}$/.test(clean);
}

/**
 * Synchronous Tamil Nadu verification with Puducherry exclusion.
 */
export function checkTamilNaduPincode(pincode: string, customDistrict?: string): TamilNaduPincodeCheckResult {
  const clean = pincode.trim().replace(/\D/g, '');

  if (clean.length !== 6) {
    return {
      served: false,
      pincode: clean,
      isPuducherry: false,
      isTamilNadu: false,
      message: 'Please enter a valid 6-digit Indian PIN code.',
    };
  }

  // 1. Explicit Puducherry check
  if (isPuducherryPincode(clean)) {
    return {
      served: false,
      pincode: clean,
      isPuducherry: true,
      isTamilNadu: false,
      message: 'Sorry, we currently deliver only within Tamil Nadu.',
    };
  }

  // 2. Tamil Nadu regex check ^(60|61|62|63|64)\d{4}$
  if (!isTamilNaduPincodeFormat(clean)) {
    return {
      served: false,
      pincode: clean,
      isPuducherry: false,
      isTamilNadu: false,
      message: 'Sorry, we currently deliver only within Tamil Nadu.',
    };
  }

  // 3. Zone classification (Chennai local vs Tamil Nadu courier)
  const pinNum = parseInt(clean, 10);
  const isChennai = pinNum >= 600001 && pinNum <= 600134;

  const district = customDistrict || (isChennai ? 'Chennai' : 'Tamil Nadu');

  const zone: TamilNaduDeliveryZone = {
    zoneName: isChennai ? 'Chennai City' : `${district} (Tamil Nadu)`,
    pincode: clean,
    district,
    state: 'Tamil Nadu',
    deliveryMethod: isChennai ? 'local_own' : 'courier_manual',
    deliveryFee: isChennai ? 40 : 60,
    freeAbove: 999,
    estimatedDaysMin: isChennai ? 1 : 2,
    estimatedDaysMax: isChennai ? 2 : 4,
  };

  return {
    served: true,
    pincode: clean,
    isPuducherry: false,
    isTamilNadu: true,
    message: isChennai
      ? `✓ Handcrafted Delivery to Chennai (${clean}) • Est. 1–2 business days`
      : `✓ Express Delivery to ${district} (${clean}) • Est. 2–4 business days`,
    zone,
  };
}

/**
 * Auto-fetches City/District and State using India Post free API.
 * Blocks if PostOffice[0].State !== "Tamil Nadu".
 */
export async function lookupIndiaPostPincode(pincode: string): Promise<{
  success: boolean;
  state?: string;
  district?: string;
  city?: string;
  postOffices?: string[];
  isTamilNadu: boolean;
  message?: string;
}> {
  const clean = pincode.trim().replace(/\D/g, '');
  if (clean.length !== 6) {
    return { success: false, isTamilNadu: false, message: 'Invalid 6-digit PIN code.' };
  }

  // Pre-check Puducherry
  if (isPuducherryPincode(clean)) {
    return {
      success: false,
      isTamilNadu: false,
      message: 'Sorry, we currently deliver only within Tamil Nadu.',
    };
  }

  // Pre-check TN format
  if (!isTamilNaduPincodeFormat(clean)) {
    return {
      success: false,
      isTamilNadu: false,
      message: 'Sorry, we currently deliver only within Tamil Nadu.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
      cache: 'force-cache',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // Graceful fallback to regex check if API service is temporarily down
      return {
        success: true,
        state: 'Tamil Nadu',
        district: '',
        city: '',
        isTamilNadu: true,
      };
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
      const first = data[0].PostOffice[0];
      const state = (first.State || '').trim();
      const district = (first.District || '').trim();
      const city = (first.Block || first.Division || first.District || first.Name || '').trim();

      // Strict validation: PostOffice State MUST be "Tamil Nadu"
      if (state.toLowerCase() !== 'tamil nadu') {
        return {
          success: false,
          state,
          district,
          city,
          isTamilNadu: false,
          message: 'Sorry, we currently deliver only within Tamil Nadu.',
        };
      }

      const postOffices = data[0].PostOffice.map((po: any) => po.Name).filter(Boolean);

      return {
        success: true,
        state: 'Tamil Nadu',
        district,
        city: district || city,
        postOffices,
        isTamilNadu: true,
      };
    }

    // If Post Office API has no records but matches TN regex, allow gracefully
    return {
      success: true,
      state: 'Tamil Nadu',
      district: '',
      city: '',
      isTamilNadu: true,
    };
  } catch (err) {
    // In case of network timeout, trust the regex check
    return {
      success: true,
      state: 'Tamil Nadu',
      district: '',
      city: '',
      isTamilNadu: true,
    };
  }
}
