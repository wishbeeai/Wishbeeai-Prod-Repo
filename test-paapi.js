// Test script for Amazon PA-API
// Usage: node test-paapi.js
// Make sure the dev server is running: npm run dev

async function testPAAPI() {
  try {
    console.log("Testing Amazon PA-API via API route...")
    console.log("Make sure the dev server is running on http://localhost:3000\n")
    
    const response = await fetch("http://localhost:3000/api/amazon-paapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productUrl: "https://www.amazon.com/dp/B0FR2WBFR2",
      }),
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log("✅ Success! Product data:")
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.error("❌ Error:")
      console.error(JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.error("Error:", err.message)
    console.error("\nMake sure:")
    console.error("1. The dev server is running: npm run dev")
    console.error("2. The server is accessible at http://localhost:3000")
  }
}

testPAAPI()

