/**
 * Smoke test for LLMMatcher.
 *
 *   npx tsx scripts/smoke-test-llm.ts
 *
 * Cost: ~$0.005 (2 small Claude Haiku 4.5 calls).
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()  // fallback to .env if .env.local missing
import { LLMMatcher } from '../shared/services/matching/llmMatcher'

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing in env. Add to .env.local first.')
    process.exit(1)
  }

  const m = new LLMMatcher({ language: 'en' })

  const cv = `Senior Frontend Engineer with 6 years of React, TypeScript, Next.js.
Built and shipped large e-commerce dashboards. Familiar with TailwindCSS,
GraphQL, REST APIs, Jest, Playwright. Led a team of 3.`

  const jdMatch = `We are hiring a Senior React Developer. Must have strong
TypeScript, Next.js, and modern frontend tooling experience. Knowledge of
testing frameworks (Jest/Cypress) is a plus.`

  const jdMismatch = `Looking for a chef de cuisine for an Italian restaurant.
Must have 10+ years preparing pasta, sauces, and managing kitchen staff.
Culinary degree preferred.`

  console.log('Smoke test: LLMMatcher\n')

  const r1 = await m.score(cv, jdMatch)
  console.log(`MATCH    score=${r1.score}  latency=${r1.latencyMs}ms  cost=$${r1.costUsd.toFixed(6)}  tokens=${r1.tokensUsed}`)
  console.log(`         matched: ${(r1.matchedKeywords ?? []).join(', ')}`)
  console.log(`         missing: ${(r1.missingKeywords ?? []).join(', ')}`)
  console.log(`         reason:  ${(r1.extras as any)?.reasoning}`)

  const r2 = await m.score(cv, jdMismatch)
  console.log(`\nMISMATCH score=${r2.score}  latency=${r2.latencyMs}ms  cost=$${r2.costUsd.toFixed(6)}  tokens=${r2.tokensUsed}`)
  console.log(`         matched: ${(r2.matchedKeywords ?? []).join(', ')}`)
  console.log(`         reason:  ${(r2.extras as any)?.reasoning}`)

  console.log(`\nAssertions:`)
  console.log(`  match > mismatch? ${r1.score > r2.score ? 'PASS' : 'FAIL'}  (${r1.score} vs ${r2.score})`)
  console.log(`  match >= 70?      ${r1.score >= 70 ? 'PASS' : 'FAIL'}  (${r1.score})`)
  console.log(`  mismatch <= 30?   ${r2.score <= 30 ? 'PASS' : 'FAIL'}  (${r2.score})`)
}

main().catch(e => { console.error(e); process.exit(1) })
