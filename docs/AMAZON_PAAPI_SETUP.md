# Amazon Product Advertising API (PA-API) Setup

This guide explains how to set up Amazon PA-API for product extraction.

## Prerequisites

1. **Amazon Associates Account**: Sign up at https://affiliate-program.amazon.com/
2. **PA-API Access**: Apply for PA-API 5.0 access through your Associates account

## Environment Variables

Add these to your `.env.local` file:

```bash
# Amazon PA-API Credentials
AMAZON_ACCESS_KEY=your_access_key_here
AMAZON_SECRET_KEY=your_secret_key_here
AMAZON_ASSOCIATE_TAG=your_associate_tag_here
AMAZON_REGION=us-east-1  # Optional, defaults to us-east-1
AMAZON_HOST=webservices.amazon.com  # Optional, defaults to webservices.amazon.com
```

## How to Get Credentials

1. **Access Key & Secret Key**:
   - Go to Amazon Associates Central
   - Navigate to Tools → Product Advertising API
   - Request access (if not already approved)
   - Create credentials in the API section

2. **Associate Tag**:
   - Your Associate Tag is found in your Associates account
   - Format: `yourstore-20` or similar
   - Must be linked to an active Associates account

## Features

- ✅ Automatic ASIN extraction from Amazon URLs
- ✅ Complete product details (name, price, images, ratings, reviews)
- ✅ Amazon-specific attributes (Prime eligibility, delivery info)
- ✅ Fallback to AI extraction if PA-API fails
- ✅ Official Amazon data (more reliable than scraping)

## Usage

When you paste an Amazon product URL in the admin form:
1. System automatically detects Amazon URL
2. Extracts ASIN from URL
3. Calls PA-API to get product details
4. Auto-fills form fields
5. Falls back to AI extraction if PA-API fails

## API Endpoint

- **Route**: `/api/amazon-paapi`
- **Method**: POST
- **Body**: `{ productUrl: "https://amazon.com/..." }` or `{ asin: "B01234567X" }`

## Troubleshooting

- **"PA-API credentials not configured"**: Check environment variables
- **"Could not extract ASIN"**: Verify the URL is a valid Amazon product URL
- **PA-API errors**: Check your API quota and request limits

