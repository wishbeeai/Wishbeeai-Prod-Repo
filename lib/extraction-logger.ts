import * as fs from 'fs'
import * as path from 'path'

// Path to the log file
const LOG_FILE_PATH = '/Users/segar/Desktop/Wishbeeai-Prod/logs/product-extraction.log'

// Log levels
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS'

// Format timestamp
function getTimestamp(): string {
  const now = new Date()
  return now.toISOString()
}

// Format log entry
function formatLogEntry(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const timestamp = getTimestamp()
  const icon = {
    'INFO': 'ℹ️',
    'WARN': '⚠️',
    'ERROR': '❌',
    'DEBUG': '🔍',
    'SUCCESS': '✅'
  }[level]
  
  let entry = `[${timestamp}] ${icon} [${level}] ${message}`
  
  if (data) {
    // Truncate long values
    const truncatedData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 500) {
        truncatedData[key] = value.substring(0, 500) + '...[truncated]'
      } else {
        truncatedData[key] = value
      }
    }
    entry += ` | Data: ${JSON.stringify(truncatedData)}`
  }
  
  return entry + '\n'
}

// Write to log file
function writeToLog(entry: string): void {
  try {
    fs.appendFileSync(LOG_FILE_PATH, entry, 'utf8')
  } catch (error) {
    // Fallback to console if file write fails
    console.error('[ExtractionLogger] Failed to write to log file:', error)
    console.log(entry)
  }
}

// Logger class
export class ExtractionLogger {
  private requestId: string
  private url: string
  private startTime: number
  
  constructor(url: string) {
    this.requestId = Math.random().toString(36).substring(2, 10)
    this.url = url
    this.startTime = Date.now()
    
    this.logSeparator()
    this.info('🚀 EXTRACTION STARTED', { url: this.truncateUrl(url) })
  }
  
  private truncateUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.hostname}${parsed.pathname.substring(0, 50)}...`
    } catch {
      return url.substring(0, 80)
    }
  }
  
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry = `[REQ:${this.requestId}] ` + formatLogEntry(level, message, data)
    writeToLog(entry)
    
    // Also log to console for dev visibility
    if (level === 'ERROR') {
      console.error(`[ExtractionLog] ${message}`, data || '')
    } else if (level === 'SUCCESS') {
      console.log(`[ExtractionLog] ✅ ${message}`, data || '')
    }
  }
  
  private logSeparator(): void {
    const separator = '\n' + '='.repeat(80) + '\n'
    writeToLog(separator)
  }
  
  info(message: string, data?: Record<string, unknown>): void {
    this.log('INFO', message, data)
  }
  
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('WARN', message, data)
  }
  
  error(message: string, data?: Record<string, unknown>): void {
    this.log('ERROR', message, data)
  }
  
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('DEBUG', message, data)
  }
  
  success(message: string, data?: Record<string, unknown>): void {
    this.log('SUCCESS', message, data)
  }
  
  // Log extracted product summary
  logProductSummary(product: {
    productName?: string | null
    price?: number | null
    imageUrl?: string | null
    rating?: number | null
    reviewCount?: number | null
    amazonChoice?: boolean
    bestSeller?: boolean
    attributes?: Record<string, unknown>
  }): void {
    this.success('PRODUCT EXTRACTED', {
      name: product.productName?.substring(0, 80) || 'N/A',
      price: product.price || 'N/A',
      hasImage: !!product.imageUrl,
      rating: product.rating || 'N/A',
      reviews: product.reviewCount || 'N/A',
      amazonChoice: product.amazonChoice || false,
      bestSeller: product.bestSeller || false,
      attributeCount: product.attributes ? Object.keys(product.attributes).filter(k => product.attributes![k]).length : 0
    })
  }
  
  // Log completion with timing
  complete(success: boolean, message?: string): void {
    const duration = Date.now() - this.startTime
    
    if (success) {
      this.success(`🏁 EXTRACTION COMPLETE in ${duration}ms`, { message })
    } else {
      this.error(`❌ EXTRACTION FAILED after ${duration}ms`, { message })
    }
    
    this.logSeparator()
  }
}

// Create a quick log function for simple messages
export function logExtraction(message: string, data?: Record<string, unknown>): void {
  const entry = formatLogEntry('INFO', message, data)
  writeToLog(entry)
}
