const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'wishbeeai-20';

/**
 * Adds affiliate tracking to product URLs
 */
export function addAffiliateTracking(url: string): string {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Amazon URLs
    if (urlObj.hostname.includes('amazon.com') || 
        urlObj.hostname.includes('amazon.co') ||
        urlObj.hostname.includes('amzn.to')) {
      
      // Remove existing tag if present
      urlObj.searchParams.delete('tag');
      
      // Add affiliate tag
      urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      
      return urlObj.toString();
    }
    
    // Add more affiliate programs here (Target, Walmart, etc.)
    
    return url;
  } catch (error) {
    // If URL parsing fails, return original
    console.error('Failed to add affiliate tracking:', error);
    return url;
  }
}

/**
 * Check if URL is an affiliate-eligible URL
 */
export function isAffiliateEligible(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('amazon.com') ||
           urlObj.hostname.includes('amazon.co') ||
           urlObj.hostname.includes('amzn.to');
  } catch {
    return false;
  }
}

