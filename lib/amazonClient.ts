// Amazon PA-API Client
// Provides a paapi5-nodejs-like interface using the amazon-paapi package

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || ""
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY || ""
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || ""
const AMAZON_REGION = process.env.AMAZON_REGION || "us-east-1"
const AMAZON_HOST = process.env.AMAZON_HOST || "webservices.amazon.com"

// PAAPI class that matches paapi5-nodejs API pattern
class PAAPI {
  accessKey: string
  secretKey: string
  partnerTag: string
  marketplace: string
  private _getItemsFn: any = null

  constructor(config: {
    accessKey: string
    secretKey: string
    partnerTag: string
    marketplace?: string
  }) {
    this.accessKey = config.accessKey
    this.secretKey = config.secretKey
    this.partnerTag = config.partnerTag
    this.marketplace = config.marketplace || "www.amazon.com"
  }

  private async getGetItemsFunction() {
    if (this._getItemsFn) {
      return this._getItemsFn
    }

    try {
      // Use dynamic import to avoid bundling issues
      const amazonPaapiModule = await import("amazon-paapi")
      const GetItems = amazonPaapiModule.GetItems || amazonPaapiModule.default?.GetItems

      if (!GetItems) {
        throw new Error("GetItems function not found in amazon-paapi module")
      }

      this._getItemsFn = GetItems
      return GetItems
    } catch (error) {
      console.error("[PA-API] Failed to load amazon-paapi:", error)
      throw new Error(`Failed to load Amazon PA-API: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getItems(requestParameters: {
    ItemIds: string[]
    Resources: string[]
  }) {
    try {
      const GetItems = await this.getGetItemsFunction()

      const commonParams = {
        AccessKey: this.accessKey,
        SecretKey: this.secretKey,
        PartnerTag: this.partnerTag,
        PartnerType: "Associates",
        Marketplace: this.marketplace,
      }

      console.log("[PA-API] Calling GetItems:", {
        AccessKey: `${this.accessKey.substring(0, 4)}...`,
        PartnerTag: this.partnerTag,
        Marketplace: this.marketplace,
        ItemIds: requestParameters.ItemIds,
      })

      const result = await GetItems(commonParams, requestParameters)

      // Check for errors in response
      if (result?.Errors && Array.isArray(result.Errors) && result.Errors.length > 0) {
        const error = result.Errors[0]
        const errorMessage = error.Message || error.message || "PA-API error"
        const errorCode = error.Code || error.code || "Unknown"
        throw new Error(`Amazon PA-API Error (${errorCode}): ${errorMessage}`)
      }

      return result
    } catch (error: any) {
      console.error("[PA-API] GetItems error:", error)

      // Helper function to sanitize Access Key IDs from error messages
      // Define this FIRST so it's available throughout the catch block
      const sanitizeAccessKey = (text: string): string => {
        // Match Access Key IDs (AKIA followed by 16 alphanumeric characters = 20 total)
        const accessKeyPattern = /AKIA[0-9A-Z]{16}/gi
        return text.replace(accessKeyPattern, "AKIA***REDACTED***")
      }

      // Extract error details
      let errorMessage = "Unknown error"
      let errorCode = null
      let errorResponseText = null

      if (error?.status) {
        errorCode = error.status
        console.error("[PA-API] HTTP Status Code:", errorCode)
      }

      if (error?.response?.text) {
        errorResponseText = error.response.text
        // Sanitize the response text immediately before logging or parsing
        const sanitizedResponseText = sanitizeAccessKey(errorResponseText)
        console.error("[PA-API] Error Response Text:", sanitizedResponseText)

        try {
          const parsedError = JSON.parse(errorResponseText)
          if (parsedError.__type || parsedError.message || parsedError.Message) {
            // Extract message and sanitize immediately
            const rawMessage = parsedError.message || parsedError.Message || JSON.stringify(parsedError)
            errorMessage = sanitizeAccessKey(rawMessage)
            
            // Also sanitize any Errors array if present
            if (parsedError.Errors && Array.isArray(parsedError.Errors)) {
              parsedError.Errors = parsedError.Errors.map((err: any) => {
                if (err.Message) err.Message = sanitizeAccessKey(err.Message)
                if (err.message) err.message = sanitizeAccessKey(err.message)
                return err
              })
            }
          }
        } catch (e) {
          errorMessage = sanitizeAccessKey(errorResponseText.substring(0, 500))
        }
      }

      if (error instanceof Error) {
        if (!errorMessage || errorMessage === "Unknown error") {
          errorMessage = error.message
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (!errorMessage || errorMessage === "Unknown error") {
        errorMessage = JSON.stringify(error).substring(0, 500)
      }

      // Sanitize error message before using it
      errorMessage = sanitizeAccessKey(errorMessage)

      // Check for Forbidden error
      if (errorMessage.includes("Forbidden") || errorMessage.includes("403") || errorCode === 403) {
        // Sanitize errorResponseText before including it
        const sanitizedResponse = errorResponseText 
          ? sanitizeAccessKey(errorResponseText.substring(0, 200))
          : null
        
        // Also sanitize the errorMessage itself (it may contain Access Key from Amazon's response)
        const sanitizedErrorMessage = sanitizeAccessKey(errorMessage)
        
        const detailedMessage = sanitizedResponse
          ? `Amazon PA-API returned Forbidden (403). Response: ${sanitizedResponse}. Please verify: 1) Your IAM Access Key and Secret Key are correct, 2) Your Associate Tag (${this.partnerTag}) is approved for PA-API 5.0 in Amazon Associates Central, 3) Your IAM user has Product Advertising API permissions enabled.`
          : `Forbidden: Amazon PA-API credentials may be invalid or the associate tag may not be approved for PA-API. Please verify your credentials.`
        
        // Ensure the final message is also sanitized
        throw new Error(sanitizeAccessKey(detailedMessage))
      }

      if (error instanceof Error) {
        if (errorResponseText) {
          const sanitizedResponse = sanitizeAccessKey(errorResponseText.substring(0, 300))
          const combinedMessage = `${sanitizeAccessKey(error.message)}. Response: ${sanitizedResponse}`
          throw new Error(sanitizeAccessKey(combinedMessage))
        }
        throw new Error(sanitizeAccessKey(error.message))
      }

      // Ensure final error message is sanitized
      throw new Error(sanitizeAccessKey(`PA-API GetItems failed: ${errorMessage}`))
    }
  }
}

// Export default as PAAPI class (matching paapi5-nodejs pattern)
// Usage: import PAAPI from "@/lib/amazonClient"; const client = new PAAPI({...})
export default PAAPI

// Create a default instance for backward compatibility
let _defaultClient: PAAPI | null = null

function getDefaultClient() {
  if (!_defaultClient) {
    if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_ASSOCIATE_TAG) {
      throw new Error("Amazon PA-API credentials are missing. Please set AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, and AMAZON_ASSOCIATE_TAG in .env.local")
    }
    _defaultClient = new PAAPI({
      accessKey: AMAZON_ACCESS_KEY,
      secretKey: AMAZON_SECRET_KEY,
      partnerTag: AMAZON_ASSOCIATE_TAG,
      marketplace: "www.amazon.com",
    })
  }
  return _defaultClient
}

// Export default instance for convenience
export const amazonClient = getDefaultClient()

export async function getAmazonItem(asin: string) {
  const client = getDefaultClient()
  const request = {
    ItemIds: [asin],
    Resources: [
      "ItemInfo.Title",
      "Images.Primary.Large",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "CustomerReviews.StarRating",
      "CustomerReviews.Count",
      "DetailPageURL",
    ],
  }

  try {
    const response = await client.getItems(request)
    
    // Check for PA-API errors first
    if (response.Errors && response.Errors.length > 0) {
      console.error("[PA-API] PA-API returned errors:", JSON.stringify(response.Errors, null, 2))
      // Return the full response so error handling can access Errors array
      return response
    }
    
    // Check if we have items
    if (!response.ItemsResult || !response.ItemsResult.Items || response.ItemsResult.Items.length === 0) {
      console.error("[PA-API] No items in response:", JSON.stringify(response, null, 2).substring(0, 500))
      throw new Error("No items found in PA-API response")
    }
    
    return response.ItemsResult.Items[0]
  } catch (error) {
    console.error("[PA-API] Error in getAmazonItem:", error)
    // Helper function to sanitize Access Key IDs
    const sanitizeAccessKey = (text: string): string => {
      const accessKeyPattern = /AKIA[0-9A-Z]{16}/gi
      return text.replace(accessKeyPattern, "AKIA***REDACTED***")
    }
    // Re-throw with more context, sanitizing any Access Key IDs
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to fetch Amazon item: ${sanitizeAccessKey(errorMessage)}`)
  }
}

export function normalizeAmazonItem(item: any) {
  return {
    title: item.ItemInfo?.Title?.DisplayValue ?? "",
    image_url: item.Images?.Primary?.Large?.URL ?? null,
    list_price: item.Offers?.Listings?.[0]?.Price?.Amount ?? null,
    currency: item.Offers?.Listings?.[0]?.Price?.Currency ?? "USD",
    review_star: item.CustomerReviews?.StarRating ?? null,
    review_count: item.CustomerReviews?.Count ?? null,
    affiliate_url: item.DetailPageURL ?? null,
  }
}
