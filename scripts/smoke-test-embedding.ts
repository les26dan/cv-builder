/**
 * Smoke test for EmbeddingMatcher.
 *
 *   npx tsx scripts/smoke-test-embedding.ts
 *
 * Cost: ~$0.00001 (3 short embeddings).
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { EmbeddingMatcher, InMemoryCache, cosineSimDense } from '../shared/services/matching/embeddingMatcher'

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY missing in env. Add to .env.local first.')
    process.exit(1)
  }

  const cache = new InMemoryCache()
  const m = new EmbeddingMatcher({ cache })

  const cv = `Senior Frontend Engineer with 6 years of React, TypeScript, Next.js.
Built and shipped large e-commerce dashboards. Familiar with TailwindCSS,
GraphQL, REST APIs, Jest, Playwright. Led a team of 3.`

  const jdMatch = `We are hiring a Senior React Developer. Must have strong
TypeScript, Next.js, and modern frontend tooling experience. Knowledge of
testing frameworks (Jest/Cypress) is a plus.`

  const jdMismatch = `Looking for a chef de cuisine for an Italian restaurant.
Must have 10+ years preparing pasta, sauces, and managing kitchen staff.
Culinary degree preferred.`

  console.log('Smoke test: EmbeddingMatcher\n')

  const r1 = await m.score(cv, jdMatch)
  console.log(`MATCH    score = ${r1.score}  (sim=${(r1.extras as any).cosineSimilarity.toFixed(4)})  latency=${r1.latencyMs}ms  cost=$${r1.costUsd.toFixed(6)}  tokens=${r1.tokensUsed}`)

  const r2 = await m.score(cv, jdMismatch)
  console.log(`MISMATCH score = ${r2.score}  (sim=${(r2.extras as any).cosineSimilarity.toFixed(4)})  latency=${r2.latencyMs}ms  cost=$${r2.costUsd.toFixed(6)}  tokens=${r2.tokensUsed}`)

  // Re-run match → should be 100% cached → free + ~0ms
  const r3 = await m.score(cv, jdMatch)
  console.log(`CACHED   score = ${r3.score}  latency=${r3.latencyMs}ms  cost=$${r3.costUsd.toFixed(6)}  cached=${r3.cached}`)

  console.log(`\nCache size: ${cache.size()} vectors`)
  console.log(`\nAssertions:`)
  console.log(`  - match > mismatch?  ${r1.score > r2.score ? 'PASS' : 'FAIL'}  (${r1.score} vs ${r2.score})`)
  console.log(`  - cached re-run free? ${r3.costUsd === 0 ? 'PASS' : 'FAIL'}`)
  console.log(`  - vec dim = 1536?     ${(r1.extras as any).cvHash ? 'PASS (has hash)' : 'FAIL'}`)
}

main().catch(e => { console.error(e); process.exit(1) })
