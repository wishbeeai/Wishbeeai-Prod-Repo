import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrendingGifts, addTrendingGift } from './store'

// Ensure store is initialized at module level
console.log(`[trending-gifts-route] Module loaded, initial store count: ${getTrendingGifts().length}`)

// GET - Fetch all trending gifts
export async function GET(req: NextRequest) {
  try {
    const trendingGifts = getTrendingGifts()
    
    return NextResponse.json({
      success: true,
      gifts: trendingGifts,
      total: trendingGifts.length,
    })
  } catch (error) {
    console.error('[trending-gifts] Error fetching trending gifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending gifts' },
      { status: 500 }
    )
  }
}

// POST - Add a product to trending gifts
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to add products to trending gifts.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.productName || !body.price || !body.image || !body.productLink) {
      return NextResponse.json(
        { error: 'Product name, price, image, and product link are required' },
        { status: 400 }
      )
    }

    // Create trending gift from affiliate product - include ALL fields including attributes
    const trendingGift = {
      id: Date.now().toString(),
      productName: body.productName,
      image: body.image,
      category: body.category || 'General',
      source: body.source || body.storeName || 'Unknown',
      price: parseFloat(body.price) || 0,
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
      rating: body.rating ? parseFloat(body.rating) : 0,
      reviewCount: body.reviewCount ? parseFloat(body.reviewCount) : 0,
      productLink: body.productLink,
      description: body.description || `${body.productName} from ${body.source || body.storeName || 'Unknown'}`,
      amazonChoice: body.amazonChoice || false,
      bestSeller: body.bestSeller || false,
      // Include all product attributes/specifications
      attributes: body.attributes ? {
        brand: body.attributes.brand || undefined,
        capacity: body.attributes.capacity || undefined,
        material: body.attributes.material || undefined,
        finishType: body.attributes.finishType || undefined,
        productDimensions: body.attributes.productDimensions || undefined,
        wattage: body.attributes.wattage || undefined,
        itemWeight: body.attributes.itemWeight || undefined,
        controlMethod: body.attributes.controlMethod || undefined,
        operationMode: body.attributes.operationMode || undefined,
        specialFeature: body.attributes.specialFeature || undefined,
        color: body.attributes.color || undefined,
        size: body.attributes.size || undefined,
        sizeOptions: body.attributes.sizeOptions || undefined,
        customFields: body.attributes.customFields || undefined,
        // Electronics-specific attributes
        operatingSystem: body.attributes.operatingSystem || undefined,
        storageCapacity: body.attributes.storageCapacity || undefined,
        ram: body.attributes.ram || undefined,
        connectivityTechnology: body.attributes.connectivityTechnology || undefined,
        wirelessStandard: body.attributes.wirelessStandard || undefined,
        batteryType: body.attributes.batteryType || undefined,
        gpsType: body.attributes.gpsType || undefined,
        shape: body.attributes.shape || undefined,
        screenSize: body.attributes.screenSize || undefined,
        resolution: body.attributes.resolution || undefined,
        processor: body.attributes.processor || undefined,
        compatibleDevices: body.attributes.compatibleDevices || undefined,
        waterResistance: body.attributes.waterResistance || undefined,
        style: body.attributes.style || undefined,
        configuration: body.attributes.configuration || undefined,
        // Audio/Headphone-specific attributes
        earPlacement: body.attributes.earPlacement || undefined,
        formFactor: body.attributes.formFactor || undefined,
        noiseControl: body.attributes.noiseControl || undefined,
        modelName: body.attributes.modelName || undefined,
        wirelessTechnology: body.attributes.wirelessTechnology || undefined,
        controlType: body.attributes.controlType || undefined,
        bluetoothVersion: body.attributes.bluetoothVersion || undefined,
        earpieceShape: body.attributes.earpieceShape || undefined,
        includedComponents: body.attributes.includedComponents || undefined,
        specificUses: body.attributes.specificUses || undefined,
        recommendedUses: body.attributes.recommendedUses || undefined,
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add to store
    const savedGift = addTrendingGift(trendingGift)

    console.log(`[trending-gifts] Product added to trending gifts: ${savedGift.id}`)
    console.log(`[trending-gifts] Total trending gifts in store: ${getTrendingGifts().length}`)
    console.log(`[trending-gifts] Saved gift data:`, JSON.stringify(savedGift, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Product added to trending gifts successfully',
      gift: savedGift,
    }, { status: 201 })
  } catch (error) {
    console.error('[trending-gifts] Error adding to trending gifts:', error)
    return NextResponse.json(
      { error: 'Failed to add product to trending gifts' },
      { status: 500 }
    )
  }
}

