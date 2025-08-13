// import { NextRequest, NextResponse } from 'next/server'
// import axios from 'axios'
// import * as cheerio from 'cheerio'

// interface SecurityScanRequest {
//   url: string
// }

// interface JSBundle {
//   url: string
//   content: string
//   size: number
//   error?: string
// }

// interface EnvVariableMatch {
//   variable: string
//   value: string
//   context: string
//   line: number
//   severity: 'critical' | 'high' | 'medium' | 'info'
//   type: string
// }

// // Helper function to validate URL
// function isValidUrl (url: string): boolean {
//   try {
//     new URL(url)
//     return true
//   } catch {
//     return false
//   }
// }

// // Extract Next.js bundle URLs from HTML
// function extractNextJSBundles (html: string, baseUrl: string): string[] {
//   const $ = cheerio.load(html)
//   const bundleUrls: string[] = []

//   // Find all script tags with Next.js bundle patterns
//   $('script[src]').each((_, element) => {
//     const src = $(element).attr('src')
//     if (src) {
//       try {
//         const absoluteUrl = new URL(src, baseUrl).toString()
//         // Focus on Next.js chunks and main bundles
//         if (
//           src.includes('_next/static/chunks/') ||
//           src.includes('_next/static/js/') ||
//           src.includes('webpack') ||
//           src.includes('main') ||
//           src.includes('framework')
//         ) {
//           bundleUrls.push(absoluteUrl)
//         }
//       } catch (error) {
//         console.error('Error processing bundle URL:', src, error)
//       }
//     }
//   })

//   return [...new Set(bundleUrls)] // Remove duplicates
// }

// // Fetch individual JS bundle content
// async function fetchBundle (url: string): Promise<JSBundle> {
//   try {
//     const response = await axios.get(url, {
//       timeout: 15000,
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)',
//         Accept: 'application/javascript, text/javascript, */*'
//       },
//       maxRedirects: 5,
//       validateStatus: status => status < 500
//     })

//     return {
//       url,
//       content: response.data,
//       size: response.data.length
//     }
//   } catch (error) {
//     return {
//       url,
//       content: '',
//       size: 0,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     }
//   }
// }

// // Scan bundle content for environment variables - be very specific
// function scanBundleForEnvVars (bundle: JSBundle): EnvVariableMatch[] {
//   const matches: EnvVariableMatch[] = []
//   if (!bundle.content || bundle.error) return matches

//   const lines = bundle.content.split('\n')

//   lines.forEach((line, lineIndex) => {
//     // Method 1: Search for specific common env variables by name
//     const commonEnvVars = [
//       'NEXT_PUBLIC_SUPABASE_URL',
//       'NEXT_PUBLIC_SUPABASE_ANON_KEY',
//       'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
//       'NEXT_PUBLIC_API_URL',
//       'NEXT_PUBLIC_API_KEY',
//       'NEXT_PUBLIC_FIREBASE_API_KEY',
//       'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
//       'REACT_APP_API_URL',
//       'REACT_APP_API_KEY',
//       'VITE_API_URL',
//       'VITE_API_KEY'
//     ]

//     commonEnvVars.forEach(envVar => {
//       // Search for the literal string in quotes
//       const literalPattern = new RegExp(`["'\`]${envVar}["'\`]`, 'g')
//       const literalMatch = literalPattern.exec(line)

//       if (literalMatch) {
//         // Try to find the value after the variable name
//         const valuePattern = new RegExp(
//           `["'\`]${envVar}["'\`]\\s*[:=]\\s*["'\`]([^"'\`]+)["'\`]`
//         )
//         const valueMatch = valuePattern.exec(line)

//         matches.push({
//           variable: envVar,
//           value: valueMatch ? valueMatch[1] : 'Found as literal string',
//           context: line.trim().substring(0, 200),
//           line: lineIndex + 1,
//           severity: classifyVariableSeverity(envVar),
//           type: 'env_literal'
//         })
//       }
//     })

//     // Method 2: Look for .env references (but be much more specific)
//     // Only match: something.env.VARIABLE_NAME where VARIABLE_NAME is clearly an env var
//     const envReferencePattern =
//       /([a-zA-Z_$][a-zA-Z0-9_$]*\.env\.)(NEXT_PUBLIC_[A-Z0-9_]+|REACT_APP_[A-Z0-9_]+|VITE_[A-Z0-9_]+)/g
//     let envMatch

//     while ((envMatch = envReferencePattern.exec(line)) !== null) {
//       const variable = envMatch[2] // The actual env var name
//       const fullMatch = envMatch[0] // The full match like "r.env.NEXT_PUBLIC_API_URL"

//       matches.push({
//         variable,
//         value:
//           extractValueFromContext(line, envMatch.index) ||
//           'Found in env reference',
//         context: line.trim().substring(0, 200),
//         line: lineIndex + 1,
//         severity: classifyVariableSeverity(variable),
//         type: 'env_reference'
//       })
//     }

//     // Method 3: Look for config objects with env-like keys
//     const configPattern =
//       /["']([A-Z][A-Z0-9_]*(?:_KEY|_SECRET|_TOKEN|_URL|_API|_ID)(?:_[A-Z0-9_]*)?|NEXT_PUBLIC_[A-Z0-9_]+)["']\s*:\s*["']([^"']{10,})["']/g
//     let configMatch

//     while ((configMatch = configPattern.exec(line)) !== null) {
//       const variable = configMatch[1]
//       const value = configMatch[2]

//       // Only include if it looks like a real env var
//       if (isDefinitelyEnvVariable(variable)) {
//         matches.push({
//           variable,
//           value,
//           context: line.trim().substring(0, 200),
//           line: lineIndex + 1,
//           severity: classifyVariableSeverity(variable),
//           type: 'env_config'
//         })
//       }
//     }
//   })

//   return matches
// }

// function extractValueFromContext (line: string, position: number): string {
//   // Try to extract the actual value being assigned
//   const afterVariable = line.substring(position)
//   const valueMatch = afterVariable.match(/[=:]\s*["']?([^"',;\s}]+)["']?/)
//   return valueMatch ? valueMatch[1] : 'Unable to extract value'
// }

// function isDefinitelyEnvVariable (variable: string): boolean {
//   // Must be uppercase and follow env var format
//   if (!/^[A-Z][A-Z0-9_]+$/.test(variable)) return false

//   // Must be at least 5 characters to avoid false positives
//   if (variable.length < 5) return false

//   // Must start with known framework prefixes OR contain specific endings
//   const frameworkPrefixes = [
//     'NEXT_PUBLIC_',
//     'REACT_APP_',
//     'VITE_',
//     'NUXT_PUBLIC_'
//   ]
//   const envEndings = [
//     '_KEY',
//     '_SECRET',
//     '_TOKEN',
//     '_URL',
//     '_API',
//     '_ID',
//     '_HOST',
//     '_DATABASE'
//   ]

//   const hasFrameworkPrefix = frameworkPrefixes.some(prefix =>
//     variable.startsWith(prefix)
//   )
//   const hasEnvEnding = envEndings.some(ending => variable.endsWith(ending))

//   return hasFrameworkPrefix || hasEnvEnding
// }

// function classifyVariableSeverity (
//   variable: string
// ): 'critical' | 'high' | 'medium' | 'info' {
//   const lowerVar = variable.toLowerCase()

//   // Critical - should NEVER be client-side
//   if (
//     lowerVar.includes('secret') ||
//     lowerVar.includes('private') ||
//     lowerVar.includes('service_role') ||
//     lowerVar.includes('admin')
//   ) {
//     return 'critical'
//   }

//   // High - API keys and tokens (could be dangerous)
//   if (
//     (lowerVar.includes('key') && !lowerVar.includes('public')) ||
//     lowerVar.includes('token') ||
//     lowerVar.includes('jwt')
//   ) {
//     return 'high'
//   }

//   // Info - Public variables (usually safe)
//   if (
//     lowerVar.includes('public') ||
//     lowerVar.includes('url') ||
//     lowerVar.includes('endpoint') ||
//     lowerVar.includes('host')
//   ) {
//     return 'info'
//   }

//   // Medium - Everything else
//   return 'medium'
// }

// export async function POST (request: NextRequest) {
//   try {
//     const body: SecurityScanRequest = await request.json()
//     const { url } = body

//     // Validate URL
//     if (!url || !isValidUrl(url)) {
//       return NextResponse.json(
//         { error: 'Invalid URL provided' },
//         { status: 400 }
//       )
//     }

//     console.log(`Starting security scan for: ${url}`)

//     // Step 1: Fetch main HTML page
//     const htmlResponse = await axios.get(url, {
//       timeout: 10000,
//       headers: {
//         'User-Agent':
//           'Mozilla/5.0 (compatible; SecurityScanner/1.0; Website Security Analysis)',
//         Accept:
//           'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
//       },
//       maxRedirects: 5,
//       validateStatus: status => status < 500
//     })

//     const html = htmlResponse.data

//     // Step 2: Extract Next.js bundle URLs
//     const bundleUrls = extractNextJSBundles(html, url)
//     console.log(`Found ${bundleUrls.length} JS bundles to scan`)

//     if (bundleUrls.length === 0) {
//       return NextResponse.json(
//         {
//           error: 'No JavaScript bundles found',
//           details:
//             'This might not be a Next.js site or bundles are not accessible'
//         },
//         { status: 404 }
//       )
//     }

//     // Step 3: Fetch all bundles (limit to prevent timeout)
//     const maxBundles = 15 // Reasonable limit
//     const bundlesToFetch = bundleUrls.slice(0, maxBundles)

//     const bundlePromises = bundlesToFetch.map(bundleUrl =>
//       fetchBundle(bundleUrl)
//     )
//     const bundles = await Promise.all(bundlePromises)

//     console.log(
//       `Successfully fetched ${bundles.filter(b => !b.error).length} bundles`
//     )

//     // Step 4: Scan all bundles for environment variables
//     const allMatches: EnvVariableMatch[] = []
//     bundles.forEach(bundle => {
//       const matches = scanBundleForEnvVars(bundle)
//       allMatches.push(...matches)
//     })

//     // Step 5: Deduplicate and organize results
//     const uniqueMatches = Array.from(
//       new Map(
//         allMatches.map(match => [`${match.variable}-${match.value}`, match])
//       ).values()
//     )

//     const summary = {
//       critical: uniqueMatches.filter(m => m.severity === 'critical').length,
//       high: uniqueMatches.filter(m => m.severity === 'high').length,
//       medium: uniqueMatches.filter(m => m.severity === 'medium').length,
//       info: uniqueMatches.filter(m => m.severity === 'info').length
//     }

//     console.log(`Scan complete: ${uniqueMatches.length} findings`, summary)

//     return NextResponse.json({
//       success: true,
//       url,
//       bundlesScanned: bundles.length,
//       bundlesFailed: bundles.filter(b => b.error).length,
//       totalFindings: uniqueMatches.length,
//       findings: uniqueMatches,
//       summary,
//       scannedBundles: bundles.map(b => ({
//         url: b.url,
//         size: b.size,
//         error: b.error
//       }))
//     })
//   } catch (error) {
//     console.error('Security scan API error:', error)

//     return NextResponse.json(
//       {
//         error: 'Security scan failed',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     )
//   }
// }

// export async function OPTIONS () {
//   return new NextResponse(null, {
//     status: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type'
//     }
//   })
// }

// 🍒 claude opus 🍒

// import { NextRequest, NextResponse } from 'next/server'
// import axios from 'axios'
// import * as cheerio from 'cheerio'

// interface SecurityScanRequest {
//   url: string
// }

// interface JSBundle {
//   url: string
//   content: string
//   size: number
//   error?: string
// }

// interface EnvVariableMatch {
//   variable: string
//   value: string
//   context: string
//   line: number
//   severity: 'critical' | 'high' | 'medium' | 'info'
//   type: string
//   bundleUrl: string
// }

// // Common environment variable patterns to search for
// const COMMON_ENV_VARS = [
//   // Supabase
//   'NEXT_PUBLIC_SUPABASE_URL',
//   'NEXT_PUBLIC_SUPABASE_ANON_KEY',
//   'SUPABASE_SERVICE_ROLE_KEY',

//   // Stripe
//   'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
//   'STRIPE_SECRET_KEY',

//   // Firebase
//   'NEXT_PUBLIC_FIREBASE_API_KEY',
//   'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
//   'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
//   'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
//   'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
//   'NEXT_PUBLIC_FIREBASE_APP_ID',

//   // AWS
//   'AWS_ACCESS_KEY_ID',
//   'AWS_SECRET_ACCESS_KEY',

//   // Generic API keys
//   'NEXT_PUBLIC_API_URL',
//   'NEXT_PUBLIC_API_KEY',
//   'NEXT_PUBLIC_API_ENDPOINT',
//   'NEXT_PUBLIC_BACKEND_URL',
//   'NEXT_PUBLIC_GRAPHQL_ENDPOINT',

//   // Auth0
//   'NEXT_PUBLIC_AUTH0_DOMAIN',
//   'NEXT_PUBLIC_AUTH0_CLIENT_ID',
//   'AUTH0_CLIENT_SECRET',

//   // Clerk
//   'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
//   'CLERK_SECRET_KEY',

//   // Google
//   'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
//   'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
//   'GOOGLE_CLIENT_SECRET',

//   // React App vars
//   'REACT_APP_API_URL',
//   'REACT_APP_API_KEY',

//   // Vite vars
//   'VITE_API_URL',
//   'VITE_API_KEY'
// ]

// // Helper function to validate URL
// function isValidUrl (url: string): boolean {
//   try {
//     new URL(url)
//     return true
//   } catch {
//     return false
//   }
// }

// // Extract Next.js bundle URLs from HTML
// function extractNextJSBundles (html: string, baseUrl: string): string[] {
//   const $ = cheerio.load(html)
//   const bundleUrls: string[] = []

//   // Find all script tags with Next.js bundle patterns
//   $('script[src]').each((_, element) => {
//     const src = $(element).attr('src')
//     if (src) {
//       try {
//         const absoluteUrl = new URL(src, baseUrl).toString()
//         // Focus on Next.js chunks and main bundles
//         if (
//           src.includes('_next/static/chunks/') ||
//           src.includes('_next/static/') ||
//           src.includes('webpack') ||
//           src.includes('main') ||
//           src.includes('app') ||
//           src.includes('pages')
//         ) {
//           bundleUrls.push(absoluteUrl)
//         }
//       } catch (error) {
//         console.error('Error processing bundle URL:', src, error)
//       }
//     }
//   })

//   // Also look for buildManifest which might contain env vars
//   const buildManifestLink = $('link[rel="preload"][as="script"]').filter(
//     (_, el) => {
//       const href = $(el).attr('href')
//       return href && href.includes('buildManifest')
//     }
//   )

//   buildManifestLink.each((_, element) => {
//     const href = $(element).attr('href')
//     if (href) {
//       try {
//         const absoluteUrl = new URL(href, baseUrl).toString()
//         bundleUrls.push(absoluteUrl)
//       } catch {}
//     }
//   })

//   return [...new Set(bundleUrls)] // Remove duplicates
// }

// // Fetch individual JS bundle content
// async function fetchBundle (url: string): Promise<JSBundle> {
//   try {
//     const response = await axios.get(url, {
//       timeout: 20000,
//       headers: {
//         'User-Agent':
//           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//         Accept: 'application/javascript, text/javascript, */*'
//       },
//       maxRedirects: 5,
//       validateStatus: status => status < 500
//     })

//     return {
//       url,
//       content: response.data,
//       size: response.data.length
//     }
//   } catch (error) {
//     return {
//       url,
//       content: '',
//       size: 0,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     }
//   }
// }

// // Extract value from surrounding context
// function extractValueFromContext (
//   content: string,
//   position: number,
//   varName: string
// ): string | null {
//   // Look for patterns like:
//   // varName:"value"
//   // varName:'value'
//   // varName:`value`
//   // varName:value (without quotes)

//   const searchRadius = 500 // Look within 500 chars
//   const start = Math.max(0, position - searchRadius)
//   const end = Math.min(content.length, position + searchRadius + varName.length)
//   const context = content.substring(start, end)

//   // Try various patterns to extract the value
//   const patterns = [
//     // Direct assignment with quotes
//     new RegExp(
//       `${escapeRegex(varName)}["']?\\s*[:=]\\s*["'\`]([^"'\`]+)["'\`]`
//     ),
//     // Object property
//     new RegExp(
//       `["']${escapeRegex(varName)}["']\\s*:\\s*["'\`]([^"'\`]+)["'\`]`
//     ),
//     // Variable reference that might have the value nearby
//     new RegExp(`${escapeRegex(varName)}[^=]*=\\s*["'\`]([^"'\`]+)["'\`]`),
//     // Look for the value right after the variable name
//     new RegExp(`${escapeRegex(varName)}["']?,["']([^"']+)["']`)
//   ]

//   for (const pattern of patterns) {
//     const match = pattern.exec(context)
//     if (match && match[1]) {
//       // Validate that the extracted value looks legitimate
//       const value = match[1].trim()
//       if (value && value.length > 5 && value.length < 500) {
//         // Check if it looks like a real value (URL, key, etc.)
//         if (looksLikeEnvValue(value)) {
//           return value
//         }
//       }
//     }
//   }

//   return null
// }

// function escapeRegex (str: string): string {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// }

// function looksLikeEnvValue (value: string): boolean {
//   // Check if the value looks like an actual environment variable value

//   // Skip if it's clearly JavaScript code
//   if (
//     value.includes('function') ||
//     value.includes('=>') ||
//     value.includes('return')
//   ) {
//     return false
//   }

//   // Skip if it's a number or boolean
//   if (value === 'true' || value === 'false' || !isNaN(Number(value))) {
//     return false
//   }

//   // Check for common patterns in env values
//   const validPatterns = [
//     /^https?:\/\//, // URLs
//     /^wss?:\/\//, // WebSocket URLs
//     /^[a-zA-Z0-9_-]{20,}/, // API keys (at least 20 chars)
//     /^pk_[a-zA-Z0-9_]+/, // Stripe publishable keys
//     /^sk_[a-zA-Z0-9_]+/, // Stripe secret keys
//     /^eyJ[a-zA-Z0-9_-]+/, // JWT tokens
//     /^[a-f0-9]{32,}/i, // Hex strings (like API keys)
//     /^[A-Z0-9_-]{10,}$/, // Generic API keys
//     /\.[a-z]{2,}$/ // Domain names
//   ]

//   return validPatterns.some(pattern => pattern.test(value))
// }

// // Scan bundle content for environment variables - much more specific
// function scanBundleForEnvVars (bundle: JSBundle): EnvVariableMatch[] {
//   const matches: EnvVariableMatch[] = []
//   if (!bundle.content || bundle.error) return matches

//   const foundVars = new Set<string>() // Track what we've already found

//   // Method 1: Direct search for known environment variable names
//   COMMON_ENV_VARS.forEach(envVar => {
//     // Search for the variable name in various contexts
//     const searchPatterns = [
//       envVar, // Direct match
//       `"${envVar}"`, // In quotes
//       `'${envVar}'`, // In single quotes
//       `\`${envVar}\`` // In backticks
//     ]

//     searchPatterns.forEach(pattern => {
//       let index = bundle.content.indexOf(pattern)
//       while (index !== -1) {
//         // Try to extract the value
//         const value = extractValueFromContext(bundle.content, index, envVar)

//         if (value && !foundVars.has(`${envVar}:${value}`)) {
//           foundVars.add(`${envVar}:${value}`)

//           // Get line number
//           const lineNumber = bundle.content
//             .substring(0, index)
//             .split('\n').length

//           // Get context
//           const contextStart = Math.max(0, index - 100)
//           const contextEnd = Math.min(bundle.content.length, index + 200)
//           const context = bundle.content
//             .substring(contextStart, contextEnd)
//             .replace(/\n/g, ' ')
//             .trim()

//           matches.push({
//             variable: envVar,
//             value: value,
//             context: context.substring(0, 200),
//             line: lineNumber,
//             severity: classifyVariableSeverity(envVar),
//             type: 'direct_match',
//             bundleUrl: bundle.url
//           })
//         }

//         index = bundle.content.indexOf(pattern, index + 1)
//       }
//     })
//   })

//   // Method 2: Look for process.env or .env. patterns with actual env var names
//   const envPatterns = [
//     /process\.env\.([A-Z][A-Z0-9_]*(?:_[A-Z0-9_]+)*)/g,
//     /process\.env\["([A-Z][A-Z0-9_]*(?:_[A-Z0-9_]+)*)"\]/g,
//     /process\.env\['([A-Z][A-Z0-9_]*(?:_[A-Z0-9_]+)*)'\]/g,
//     /\.env\.([A-Z][A-Z0-9_]*(?:_[A-Z0-9_]+)*)/g
//   ]

//   envPatterns.forEach(pattern => {
//     let match
//     while ((match = pattern.exec(bundle.content)) !== null) {
//       const varName = match[1]

//       // Only process if it looks like a real env var
//       if (isLikelyEnvVariable(varName)) {
//         const value = extractValueFromContext(
//           bundle.content,
//           match.index,
//           varName
//         )

//         if (value && !foundVars.has(`${varName}:${value}`)) {
//           foundVars.add(`${varName}:${value}`)

//           const lineNumber = bundle.content
//             .substring(0, match.index)
//             .split('\n').length
//           const contextStart = Math.max(0, match.index - 100)
//           const contextEnd = Math.min(bundle.content.length, match.index + 200)
//           const context = bundle.content
//             .substring(contextStart, contextEnd)
//             .replace(/\n/g, ' ')
//             .trim()

//           matches.push({
//             variable: varName,
//             value: value,
//             context: context.substring(0, 200),
//             line: lineNumber,
//             severity: classifyVariableSeverity(varName),
//             type: 'env_reference',
//             bundleUrl: bundle.url
//           })
//         }
//       }
//     }
//   })

//   // Method 3: Look for config objects with environment-like key-value pairs
//   // This catches cases where env vars are embedded in config objects
//   const configPattern =
//     /["']([A-Z][A-Z0-9_]*(?:_[A-Z0-9_]+)*)["']\s*:\s*["']([^"']+)["']/g
//   let configMatch

//   while ((configMatch = configPattern.exec(bundle.content)) !== null) {
//     const varName = configMatch[1]
//     const value = configMatch[2]

//     // Validate both the variable name and value
//     if (isLikelyEnvVariable(varName) && looksLikeEnvValue(value)) {
//       if (!foundVars.has(`${varName}:${value}`)) {
//         foundVars.add(`${varName}:${value}`)

//         const lineNumber = bundle.content
//           .substring(0, configMatch.index)
//           .split('\n').length
//         const contextStart = Math.max(0, configMatch.index - 100)
//         const contextEnd = Math.min(
//           bundle.content.length,
//           configMatch.index + 200
//         )
//         const context = bundle.content
//           .substring(contextStart, contextEnd)
//           .replace(/\n/g, ' ')
//           .trim()

//         matches.push({
//           variable: varName,
//           value: value,
//           context: context.substring(0, 200),
//           line: lineNumber,
//           severity: classifyVariableSeverity(varName),
//           type: 'config_object',
//           bundleUrl: bundle.url
//         })
//       }
//     }
//   }

//   return matches
// }

// function isLikelyEnvVariable (variable: string): boolean {
//   // Must be uppercase with underscores
//   if (!/^[A-Z][A-Z0-9_]*$/.test(variable)) return false

//   // Must be at least 8 characters to avoid false positives
//   if (variable.length < 8) return false

//   // Check for known prefixes
//   const knownPrefixes = [
//     'NEXT_PUBLIC_',
//     'REACT_APP_',
//     'VITE_',
//     'GATSBY_',
//     'NUXT_',
//     'VUE_APP_'
//   ]

//   const hasKnownPrefix = knownPrefixes.some(prefix =>
//     variable.startsWith(prefix)
//   )

//   // Check for known suffixes that indicate env vars
//   const knownSuffixes = [
//     '_KEY',
//     '_SECRET',
//     '_TOKEN',
//     '_URL',
//     '_URI',
//     '_ENDPOINT',
//     '_API',
//     '_ID',
//     '_HOST',
//     '_PORT',
//     '_DATABASE',
//     '_PASSWORD',
//     '_USERNAME'
//   ]

//   const hasKnownSuffix = knownSuffixes.some(suffix => variable.endsWith(suffix))

//   // Must have either a known prefix OR a known suffix OR be in our common list
//   return hasKnownPrefix || hasKnownSuffix || COMMON_ENV_VARS.includes(variable)
// }

// function classifyVariableSeverity (
//   variable: string
// ): 'critical' | 'high' | 'medium' | 'info' {
//   const lowerVar = variable.toLowerCase()

//   // Critical - should NEVER be in client-side code
//   if (
//     lowerVar.includes('secret') ||
//     lowerVar.includes('private') ||
//     lowerVar.includes('service_role') ||
//     lowerVar.includes('admin') ||
//     lowerVar.includes('password') ||
//     lowerVar.includes('database')
//   ) {
//     return 'critical'
//   }

//   // High - API keys and tokens (potentially dangerous)
//   if (
//     (lowerVar.includes('key') && !lowerVar.includes('public')) ||
//     lowerVar.includes('token') ||
//     lowerVar.includes('jwt') ||
//     (lowerVar.includes('auth') && !lowerVar.includes('domain'))
//   ) {
//     return 'high'
//   }

//   // Info - Public variables (usually safe but worth noting)
//   if (lowerVar.includes('public') || lowerVar.includes('publishable')) {
//     return 'info'
//   }

//   // Medium - URLs and other config
//   if (
//     lowerVar.includes('url') ||
//     lowerVar.includes('endpoint') ||
//     lowerVar.includes('domain') ||
//     lowerVar.includes('host')
//   ) {
//     return 'medium'
//   }

//   // Default to medium for anything else
//   return 'medium'
// }

// export async function POST (request: NextRequest) {
//   try {
//     const body: SecurityScanRequest = await request.json()
//     const { url } = body

//     // Validate URL
//     if (!url || !isValidUrl(url)) {
//       return NextResponse.json(
//         { error: 'Invalid URL provided' },
//         { status: 400 }
//       )
//     }

//     console.log(`Starting security scan for: ${url}`)

//     // Step 1: Fetch main HTML page
//     const htmlResponse = await axios.get(url, {
//       timeout: 15000,
//       headers: {
//         'User-Agent':
//           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//         Accept:
//           'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
//       },
//       maxRedirects: 5,
//       validateStatus: status => status < 500
//     })

//     const html = htmlResponse.data

//     // Step 2: Extract Next.js bundle URLs
//     const bundleUrls = extractNextJSBundles(html, url)
//     console.log(`Found ${bundleUrls.length} JS bundles to scan`)

//     if (bundleUrls.length === 0) {
//       return NextResponse.json(
//         {
//           error: 'No JavaScript bundles found',
//           details:
//             'This might not be a Next.js/React site or bundles are not accessible'
//         },
//         { status: 404 }
//       )
//     }

//     // Step 3: Fetch all bundles (with reasonable limit)
//     const maxBundles = 20
//     const bundlesToFetch = bundleUrls.slice(0, maxBundles)

//     const bundlePromises = bundlesToFetch.map(bundleUrl =>
//       fetchBundle(bundleUrl)
//     )
//     const bundles = await Promise.all(bundlePromises)

//     console.log(
//       `Successfully fetched ${bundles.filter(b => !b.error).length} bundles`
//     )

//     // Step 4: Scan all bundles for environment variables
//     const allMatches: EnvVariableMatch[] = []
//     bundles.forEach(bundle => {
//       const matches = scanBundleForEnvVars(bundle)
//       allMatches.push(...matches)
//     })

//     // Step 5: Deduplicate matches (keep unique variable+value combinations)
//     const uniqueMatches = Array.from(
//       new Map(
//         allMatches.map(match => [`${match.variable}:${match.value}`, match])
//       ).values()
//     )

//     // Sort by severity
//     uniqueMatches.sort((a, b) => {
//       const severityOrder = { critical: 0, high: 1, medium: 2, info: 3 }
//       return severityOrder[a.severity] - severityOrder[b.severity]
//     })

//     const summary = {
//       critical: uniqueMatches.filter(m => m.severity === 'critical').length,
//       high: uniqueMatches.filter(m => m.severity === 'high').length,
//       medium: uniqueMatches.filter(m => m.severity === 'medium').length,
//       info: uniqueMatches.filter(m => m.severity === 'info').length
//     }

//     console.log(
//       `Scan complete: ${uniqueMatches.length} real environment variables found`,
//       summary
//     )

//     return NextResponse.json({
//       success: true,
//       url,
//       bundlesScanned: bundles.length,
//       bundlesFailed: bundles.filter(b => b.error).length,
//       totalFindings: uniqueMatches.length,
//       findings: uniqueMatches.map(match => ({
//         variable: match.variable,
//         value: match.value,
//         severity: match.severity,
//         type: match.type,
//         bundleUrl: match.bundleUrl,
//         line: match.line,
//         context: match.context
//       })),
//       summary,
//       scannedBundles: bundles.map(b => ({
//         url: b.url,
//         size: b.size,
//         error: b.error
//       }))
//     })
//   } catch (error) {
//     console.error('Security scan API error:', error)

//     return NextResponse.json(
//       {
//         error: 'Security scan failed',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     )
//   }
// }

// export async function OPTIONS () {
//   return new NextResponse(null, {
//     status: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type'
//     }
//   })
// }

// 🍒 chatgpt5 🍒

import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface SecurityScanRequest {
  url: string
}

interface JSBundle {
  url: string
  content: string
  size: number
  error?: string
}

interface EnvVariableMatch {
  variable: string
  value: string | null
  bundleUrl: string
  line: number
  context: string
  severity: 'critical' | 'high' | 'medium' | 'info'
}

const COMMON_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_API_KEY',
  'NEXT_PUBLIC_API_ENDPOINT',
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_GRAPHQL_ENDPOINT',
  'NEXT_PUBLIC_AUTH0_DOMAIN',
  'NEXT_PUBLIC_AUTH0_CLIENT_ID',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'REACT_APP_API_URL',
  'REACT_APP_API_KEY',
  'VITE_API_URL',
  'VITE_API_KEY'
]

function isValidUrl (url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function extractNextJSBundles (html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const bundleUrls: string[] = []

  $('script[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src && src.endsWith('.js')) {
      if (
        src.includes('_next/static/') ||
        src.includes('static/js/') ||
        src.includes('chunks/') ||
        src.includes('webpack') ||
        src.includes('main') ||
        src.includes('app') ||
        src.includes('pages') ||
        src.includes('vendor') ||
        src.includes('runtime') ||
        src.includes('framework')
      ) {
        try {
          bundleUrls.push(new URL(src, baseUrl).toString())
        } catch {}
      }
    }
  })

  // Inline script scanning
  $('script:not([src])').each((_, el) => {
    const content = $(el).html()
    if (content && content.includes('process.env')) {
      bundleUrls.push(`inline-script-${bundleUrls.length}`)
    }
  })

  return [...new Set(bundleUrls)]
}

async function fetchBundle (url: string, html?: string): Promise<JSBundle> {
  if (url.startsWith('inline-script-') && html) {
    return { url, content: html, size: html.length }
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return { url, content: text, size: text.length }
  } catch (err) {
    return {
      url,
      content: '',
      size: 0,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

function looksLikeEnvValue (value: string): boolean {
  const patterns = [
    /^https?:\/\/[^\s]+$/i,
    /^wss?:\/\/[^\s]+$/i,
    /^[a-zA-Z0-9_-]{20,}$/,
    /^pk_[a-zA-Z0-9_]+$/,
    /^sk_[a-zA-Z0-9_]+$/,
    /^eyJ[a-zA-Z0-9_-]+$/,
    /^[a-f0-9]{32,}$/i
  ]
  return patterns.some(p => p.test(value))
}

function classifyVariableSeverity (
  variable: string
): 'critical' | 'high' | 'medium' | 'info' {
  const lower = variable.toLowerCase()
  if (lower.includes('secret') || lower.includes('service_role'))
    return 'critical'
  if (lower.includes('key') && !lower.includes('public')) return 'high'
  if (lower.includes('public') || lower.includes('publishable')) return 'info'
  return 'medium'
}

function findAllProcessEnvReferences(content: string, bundleUrl: string): EnvVariableMatch[] {
  const matches: EnvVariableMatch[] = []

  // Comprehensive patterns to catch all possible process.env references
  const patterns = [
    /process\.env\.([A-Za-z0-9_]+)/g, // process.env.VAR
    /process\.env\[['"]([A-Za-z0-9_]+)['"]\]/g, // process.env["VAR"]
    /process\[['"]env['"]\]\[['"]([A-Za-z0-9_]+)['"]\]/g, // process["env"]["VAR"]
    /process\[['"]env['"]\]\.([A-Za-z0-9_]+)/g, // process["env"].VAR
  ]

  for (const regex of patterns) {
    let match
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1]
      let value: string | null = null

      // Try to find a value nearby (within 200 chars after match)
      const after = content.substring(match.index, match.index + 200)
      const valuePatterns = [
        /["']([^"']{1,200})["']/,  // Basic quoted string
        /:\s*["']([^"']+)["']/,    // Object property value
        /=\s*["']([^"']+)["']/,    // Assignment value
        /,\s*["']([^"']+)["']/     // Array/parameter value
      ]
      
      for (const valuePattern of valuePatterns) {
        const valueMatch = valuePattern.exec(after)
        if (valueMatch && valueMatch[1] && valueMatch[1] !== varName && looksLikeEnvValue(valueMatch[1])) {
          value = valueMatch[1]
          break
        }
      }

      matches.push({
        variable: `process.env.${varName}`,
        value,
        bundleUrl,
        line: content.substring(0, match.index).split("\n").length,
        context: content
          .substring(Math.max(0, match.index - 50), match.index + 200)
          .replace(/\n/g, " "),
        severity: classifyVariableSeverity(varName),
      })
    }
  }

  return matches
}

function findGlobalConfigReferences(content: string, bundleUrl: string): EnvVariableMatch[] {
  const matches: EnvVariableMatch[] = []
  
  // Global config object patterns
  const globalPatterns = [
    /window\.__env__\.([A-Za-z0-9_]+)/g,
    /window\.__RUNTIME_CONFIG__\.([A-Za-z0-9_]+)/g,
    /globalThis\.__env__\.([A-Za-z0-9_]+)/g,
    /window\.__CONFIG__\.([A-Za-z0-9_]+)/g,
    /__ENV__\.([A-Za-z0-9_]+)/g,
    /window\.env\.([A-Za-z0-9_]+)/g
  ]

  for (const regex of globalPatterns) {
    let match
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1]
      let value: string | null = null

      // Try to extract value from context
      const after = content.substring(match.index, match.index + 200)
      const valueMatch = after.match(/["']([^"']{1,200})["']/)
      if (valueMatch && valueMatch[1] && valueMatch[1] !== varName && looksLikeEnvValue(valueMatch[1])) {
        value = valueMatch[1]
      }

      matches.push({
        variable: match[0], // Full match like "window.__env__.API_KEY"
        value,
        bundleUrl,
        line: content.substring(0, match.index).split("\n").length,
        context: content
          .substring(Math.max(0, match.index - 50), match.index + 200)
          .replace(/\n/g, " "),
        severity: classifyVariableSeverity(varName),
      })
    }
  }

  return matches
}

function scanBundle (bundle: JSBundle): EnvVariableMatch[] {
  if (!bundle.content || bundle.error) return []

  const matches: EnvVariableMatch[] = []

  // 1. Known sensitive vars (specific detection with values)
  for (const envVar of COMMON_ENV_VARS) {
    const patterns = [
      new RegExp(`["']${envVar}["']\\s*:\\s*["']([^"']+)["']`, 'g'),
      new RegExp(`process\\.env\\.${envVar}\\s*=\\s*["']([^"']+)["']`, 'g'),
      new RegExp(`${envVar}\\s*:\\s*["']([^"']+)["']`, 'g')
    ]
    for (const regex of patterns) {
      let match
      while ((match = regex.exec(bundle.content)) !== null) {
        const value = match[1]
        if (looksLikeEnvValue(value)) {
          matches.push({
            variable: envVar,
            value,
            bundleUrl: bundle.url,
            line: bundle.content.substring(0, match.index).split('\n').length,
            context: bundle.content
              .substring(Math.max(0, match.index - 50), match.index + 200)
              .replace(/\n/g, ' '),
            severity: classifyVariableSeverity(envVar)
          })
        }
      }
    }
  }

  // 2. Catch-all NEXT_PUBLIC_* (with values)
  const nextPublicRegex = /["'](NEXT_PUBLIC_[A-Z0-9_]+)["']\s*:\s*["']([^"']+)["']/g
  let npMatch
  while ((npMatch = nextPublicRegex.exec(bundle.content)) !== null) {
    matches.push({
      variable: npMatch[1],
      value: npMatch[2],
      bundleUrl: bundle.url,
      line: bundle.content.substring(0, npMatch.index).split('\n').length,
      context: bundle.content
        .substring(Math.max(0, npMatch.index - 50), npMatch.index + 200)
        .replace(/\n/g, ' '),
      severity: classifyVariableSeverity(npMatch[1])
    })
  }

  // 3. ALL process.env references (comprehensive patterns)
  matches.push(...findAllProcessEnvReferences(bundle.content, bundle.url))

  // 4. Global config object references
  matches.push(...findGlobalConfigReferences(bundle.content, bundle.url))

  return matches
}

export async function POST (request: NextRequest) {
  try {
    const body: SecurityScanRequest = await request.json()
    const { url } = body

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const htmlRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await htmlRes.text()
    const bundleUrls = extractNextJSBundles(html, url)

    if (!bundleUrls.length) {
      return NextResponse.json(
        { error: 'No JavaScript bundles found' },
        { status: 404 }
      )
    }

    const bundles = await Promise.all(
      bundleUrls.map(bundleUrl => fetchBundle(bundleUrl, html))
    )

    const findings = bundles.flatMap(scanBundle)
    
    // Better deduplication that handles null values properly
    const uniqueFindings = Array.from(
      new Map(
        findings.map(f => {
          // Create a unique key that handles null values
          const key = `${f.variable}:${f.value || 'NULL_VALUE'}:${f.bundleUrl}`
          return [key, f]
        })
      ).values()
    )

    // Sort by severity (critical first) then by variable name
    uniqueFindings.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, info: 3 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return a.variable.localeCompare(b.variable)
    })

    const summary = {
      critical: uniqueFindings.filter(f => f.severity === 'critical').length,
      high: uniqueFindings.filter(f => f.severity === 'high').length,
      medium: uniqueFindings.filter(f => f.severity === 'medium').length,
      info: uniqueFindings.filter(f => f.severity === 'info').length
    }

    console.log(`Scan complete: ${uniqueFindings.length} findings`, summary)
    console.log('Sample findings:', uniqueFindings.slice(0, 3).map(f => ({ variable: f.variable, value: f.value })))

    return NextResponse.json({
      success: true,
      url,
      bundlesScanned: bundles.length,
      bundlesFailed: bundles.filter(b => b.error).length,
      totalFindings: uniqueFindings.length,
      findings: uniqueFindings.map(f => ({
        variable: f.variable,
        value: f.value,
        severity: f.severity,
        type: f.value ? 'env_variable_with_value' : 'env_variable_reference',
        context: f.context,
        line: f.line,
        bundleUrl: f.bundleUrl
      })),
      summary,
      scannedBundles: bundles.map(b => ({
        url: b.url,
        size: b.size,
        error: b.error
      })),
      scanTime: Date.now()
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Scan failed',
        details: err instanceof Error ? err.message : err
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS () {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
