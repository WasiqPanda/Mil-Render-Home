const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  const origin = window.location.origin;
  
  // If we're running in a standard web environment (not localhost or capacitor)
  // we can use relative paths.
  if (origin.includes('.run.app') || (origin.includes('localhost') && !window.location.protocol.includes('capacitor'))) {
    return '';
  }

  // For Capacitor/Mobile, we MUST point to the actual hosted server.
  // Replace this with your actual deployed URL if it changes.
  return 'https://ais-dev-p6dtcdp4ccj3uxh3sigzft-50128653243.asia-southeast1.run.app';
};

export const API_BASE_URL = getBaseUrl();
