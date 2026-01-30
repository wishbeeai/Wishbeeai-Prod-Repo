#!/usr/bin/env tsx
/**
 * Setup Verification Script
 * 
 * Verifies that all required environment variables and dependencies are configured.
 * Run with: npx tsx scripts/verify-setup.ts
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

const OPTIONAL_ENV_VARS = [
  'STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'FAL_KEY',
  'ANTHROPIC_API_KEY',
]

const REQUIRED_FILES = [
  'lib/supabase/admin.ts',
  'app/api/webhooks/stripe/route.ts',
  'scripts/check-service-role-key-safety.ts',
  'supabase/migrations/001_contributions_security.sql',
  '.cursorrules',
]

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

const results: CheckResult[] = []

function checkEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables...\n')

  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''

  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8')
  }

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const isSet = process.env[varName] !== undefined || envContent.includes(varName)
    if (isSet) {
      results.push({
        name: varName,
        status: 'pass',
        message: '✅ Configured',
      })
      console.log(`  ✅ ${varName}`)
    } else {
      results.push({
        name: varName,
        status: 'fail',
        message: '❌ Missing - Add to .env.local',
      })
      console.log(`  ❌ ${varName} - MISSING`)
    }
  }

  // Check optional variables
  console.log('\n📋 Optional Environment Variables...\n')
  for (const varName of OPTIONAL_ENV_VARS) {
    const isSet = process.env[varName] !== undefined || envContent.includes(varName)
    if (isSet) {
      results.push({
        name: varName,
        status: 'pass',
        message: '✅ Configured',
      })
      console.log(`  ✅ ${varName}`)
    } else {
      results.push({
        name: varName,
        status: 'warning',
        message: '⚠️  Optional - Not configured',
      })
      console.log(`  ⚠️  ${varName} - Optional (not configured)`)
    }
  }

  if (!existsSync(envPath)) {
    console.log('\n⚠️  Warning: .env.local file not found')
    console.log('   Create it from .env.example template\n')
  }
}

function checkRequiredFiles() {
  console.log('\n📁 Checking Required Files...\n')

  for (const filePath of REQUIRED_FILES) {
    const fullPath = join(process.cwd(), filePath)
    if (existsSync(fullPath)) {
      results.push({
        name: filePath,
        status: 'pass',
        message: '✅ Exists',
      })
      console.log(`  ✅ ${filePath}`)
    } else {
      results.push({
        name: filePath,
        status: 'fail',
        message: '❌ Missing',
      })
      console.log(`  ❌ ${filePath} - MISSING`)
    }
  }
}

function checkDependencies() {
  console.log('\n📦 Checking Dependencies...\n')

  const packageJsonPath = join(process.cwd(), 'package.json')
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    const requiredDeps = [
      '@supabase/supabase-js',
      '@supabase/ssr',
      'stripe',
      'zod',
    ]

    const devDeps = ['tsx', 'typescript']

    for (const dep of requiredDeps) {
      if (allDeps[dep]) {
        console.log(`  ✅ ${dep} (${allDeps[dep]})`)
      } else {
        console.log(`  ❌ ${dep} - MISSING`)
        results.push({
          name: dep,
          status: 'fail',
          message: '❌ Missing dependency',
        })
      }
    }

    console.log('\n📦 Dev Dependencies...\n')
    for (const dep of devDeps) {
      if (allDeps[dep]) {
        console.log(`  ✅ ${dep} (${allDeps[dep]})`)
      } else {
        console.log(`  ⚠️  ${dep} - Recommended for scripts`)
        results.push({
          name: dep,
          status: 'warning',
          message: '⚠️  Recommended but not required',
        })
      }
    }
  }
}

function checkSecurity() {
  console.log('\n🔒 Security Checks...\n')

  // Check if service role key is in client files
  try {
    const { execSync } = require('child_process')
    try {
      execSync('npx tsx scripts/check-service-role-key-safety.ts', {
        stdio: 'pipe',
        cwd: process.cwd(),
      })
      console.log('  ✅ Service role key safety check passed')
      results.push({
        name: 'Service Role Key Safety',
        status: 'pass',
        message: '✅ No violations found',
      })
    } catch (error) {
      console.log('  ❌ Service role key safety check failed')
      results.push({
        name: 'Service Role Key Safety',
        status: 'fail',
        message: '❌ Violations detected - Run: npm run check:security',
      })
    }
  } catch (error) {
    console.log('  ⚠️  Could not run security check (tsx may not be installed)')
    results.push({
      name: 'Service Role Key Safety',
      status: 'warning',
      message: '⚠️  Could not verify - Install tsx: npm install -D tsx',
    })
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 SETUP VERIFICATION SUMMARY')
  console.log('='.repeat(60) + '\n')

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}\n`)

  if (failed > 0) {
    console.log('❌ CRITICAL ISSUES FOUND:\n')
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.message}`)
      })
    console.log('\n')
  }

  if (warnings > 0) {
    console.log('⚠️  RECOMMENDATIONS:\n')
    results
      .filter(r => r.status === 'warning')
      .forEach(r => {
        console.log(`  ⚠️  ${r.name}: ${r.message}`)
      })
    console.log('\n')
  }

  if (failed === 0) {
    console.log('🎉 All critical checks passed!')
    console.log('\n📋 Next Steps:')
    console.log('  1. Apply database migration in Supabase Dashboard')
    console.log('  2. Configure Stripe webhook endpoint')
    console.log('  3. Test payment flow end-to-end')
    console.log('\n')
  } else {
    console.log('⚠️  Please fix the critical issues above before proceeding.\n')
    process.exit(1)
  }
}

// Main execution
console.log('🔍 Wishbee-AI Setup Verification\n')
console.log('='.repeat(60))

checkEnvironmentVariables()
checkRequiredFiles()
checkDependencies()
checkSecurity()
printSummary()

