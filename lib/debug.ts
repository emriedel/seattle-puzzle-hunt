// Debug utilities for testing location-based features

export interface DebugLocation {
  lat: number;
  lng: number;
  name?: string;
}

export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === 'true') {
    localStorage.setItem('puzzle-hunt-debug', 'true');
    return true;
  }

  // Check localStorage
  return localStorage.getItem('puzzle-hunt-debug') === 'true';
}

export function setDebugMode(enabled: boolean) {
  if (typeof window === 'undefined') return;

  if (enabled) {
    localStorage.setItem('puzzle-hunt-debug', 'true');
  } else {
    localStorage.removeItem('puzzle-hunt-debug');
    localStorage.removeItem('debug-location');
  }
}

export function setDebugLocation(location: DebugLocation | null) {
  if (typeof window === 'undefined') return;

  if (location) {
    localStorage.setItem('debug-location', JSON.stringify(location));
  } else {
    localStorage.removeItem('debug-location');
  }
}

export function getDebugLocation(): DebugLocation | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('debug-location');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Get user location, or debug location if in debug mode
export async function getUserLocation(): Promise<GeolocationPosition> {
  if (isDebugMode()) {
    const debugLoc = getDebugLocation();
    if (debugLoc) {
      // Return a mock GeolocationPosition
      return {
        coords: {
          latitude: debugLoc.lat,
          longitude: debugLoc.lng,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;
    }
  }

  // Use real geolocation
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}
