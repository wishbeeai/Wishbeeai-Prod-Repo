#!/usr/bin/env tsx
/**
 * Service Role Key Safety Scanner
 * 
 * This script scans your codebase to ensure SUPABASE_SERVICE_ROLE_KEY
 * is never used in client-side code ("use client" files).
 * 
 * Run with: npx tsx scripts/check-service-role-key-safety.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const CLIENT_DIRECTIVE = "'use client'"
const SERVICE_ROLE_KEY = 'SUPABASE_SERVICE_ROLE_KEY'
const ALLOWED_PATTERNS = [
  /\.env/, // Environment files are okay (they're gitignored)
  /node_modules/, // Dependencies are okay
  /\.next/, // Build artifacts are okay
  /scripts/, // Scripts are okay (they're server-side)
]

let violations: Array<{ file: string; line: number; content: string }> = []
let filesScanned = 0

function shouldSkipFile(filePath: string): boolean {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(filePath))
}

function isClientFile(content: string): boolean {
  // Check if file starts with 'use client' directive
  const trimmed = content.trim()
  return trimmed.startsWith(CLIENT_DIRECTIVE) || trimmed.startsWith('"use client"')
}

function scanFile(filePath: string): void {
  if (shouldSkipFile(filePath)) {
    return
  }

  const ext = extname(filePath)
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return
  }

  filesScanned++

  try {
    const content = readFileSync(filePath, 'utf-8')
    const isClient = isClientFile(content)

    if (isClient && content.includes(SERVICE_ROLE_KEY)) {
      // Find line numbers where SERVICE_ROLE_KEY appears
      const lines = content.split('\n')
      lines.forEach((line, index) => {
        if (line.includes(SERVICE_ROLE_KEY)) {
          violations.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
          })
        }
      })
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
  }
}

function scanDirectory(dirPath: string): void {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      if (shouldSkipFile(fullPath)) {
        continue
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath)
      } else if (entry.isFile()) {
        scanFile(fullPath)
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error)
  }
}

// Main execution
console.log('🔒 Scanning codebase for service role key safety...\n')

const projectRoot = join(process.cwd())
scanDirectory(join(projectRoot, 'app'))
scanDirectory(join(projectRoot, 'components'))
scanDirectory(join(projectRoot, 'lib'))

console.log(`✅ Scanned ${filesScanned} files\n`)

if (violations.length > 0) {
  console.error('❌ SECURITY VIOLATION DETECTED!\n')
  console.error(
    `Found ${violations.length} violation(s) where SUPABASE_SERVICE_ROLE_KEY is used in client-side code:\n`
  )

  violations.forEach((violation, index) => {
    console.error(`${index + 1}. ${violation.file}:${violation.line}`)
    console.error(`   ${violation.content}\n`)
  })

  console.error(
    '⚠️  SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY must NEVER be used in "use client" files!\n'
  )
  console.error(
    '   The service role key bypasses Row Level Security and can access all data.\n'
  )
  console.error(
    '   Solutions:\n'
  )
  console.error('   1. Move the code to a server-side API route')
  console.error('   2. Use the regular Supabase client (lib/supabase/client.ts) instead')
  console.error('   3. Call your API route from the client, which can use the admin client')

  process.exit(1)
} else {
  console.log('✅ No security violations found!')
  console.log('   Service role key is safely restricted to server-side code.\n')
  process.exit(0)
}

