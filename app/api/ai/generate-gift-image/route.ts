export async function POST(req: Request) {
  try {
    const { recipientName, occasion, giftName, productName, description } = await req.json()

    // For wishlist product image generation
    if (productName || (giftName && !recipientName && !occasion)) {
      const product = productName || giftName
      const prompt = `Create a professional, high-quality product photo of: ${product}${description ? `. ${description}` : ""}

Style: Clean, modern product photography with white or neutral background, studio lighting, showing the product clearly and attractively. Photorealistic, commercial quality.`

      const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: "square",
          num_inference_steps: 4,
          num_images: 1,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()

      if (data.images && data.images.length > 0) {
        return Response.json({
          imageUrl: data.images[0].url,
        })
      }

      return Response.json({ error: "No image generated" }, { status: 500 })
    }

    // For gift collection banner (existing functionality)
    if (!recipientName || !occasion || !giftName) {
      return Response.json({ error: "Product name or gift details required" }, { status: 400 })
    }

    const prompt = `Create a beautiful, celebratory banner image for a group gift collection:
- Recipient: ${recipientName}
- Occasion: ${occasion}
- Gift: ${giftName}

Style: Warm, festive, celebratory with gift boxes, confetti, and elegant typography. High quality, professional design.`

    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate image")
    }

    const data = await response.json()

    if (data.images && data.images.length > 0) {
      const imageResponse = await fetch(data.images[0].url)
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString("base64")

      return Response.json({
        image: {
          base64,
          mediaType: "image/jpeg",
        },
      })
    }

    return Response.json({ error: "No image generated" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error generating gift image:", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
