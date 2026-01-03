// Test script for Amazon PA-API
// Usage: npx tsx test-paapi.ts

import PAAPI from "./lib/amazonClient"

const client = new PAAPI({
  accessKey: process.env.AMAZON_ACCESS_KEY!,
  secretKey: process.env.AMAZON_SECRET_KEY!,
  partnerTag: process.env.AMAZON_ASSOCIATE_TAG!,
  marketplace: "www.amazon.com",
})

async function testPAAPI() {
  try {
    const response = await client.getItems({
      ItemIds: ["B0FR2WBFR2"],
      Resources: [
        "ItemInfo.Title",
        "Images.Primary.Large",
        "Offers.Listings.Price",
        "CustomerReviews.StarRating",
        "CustomerReviews.Count"
      ],
    })
    console.log("Success! Response:", JSON.stringify(response, null, 2))
  } catch (err) {
    console.error("Error:", err)
  }
}

testPAAPI()

