import express from 'express'
import { fetchNcbiGene, GeneNotFoundError, GeneRequestTimeoutError, MalformedGeneResponseError, UpstreamGeneError } from './ncbiGeneClient.js'
import type { GuideWiseGene } from './types.js'

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
interface CacheEntry { expiresAt: number; value: GuideWiseGene }

export function createApp({
  fetchImpl = globalThis.fetch,
  timeoutMs = Number(process.env.NCBI_TIMEOUT_MS ?? 8_000),
  cacheTtlMs = Number(process.env.GENE_CACHE_TTL_MS ?? 300_000),
  apiKey = process.env.NCBI_API_KEY,
}: { fetchImpl?: FetchLike; timeoutMs?: number; cacheTtlMs?: number; apiKey?: string } = {}) {
  const app = express()
  const cache = new Map<string, CacheEntry>()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '32kb' }))

  app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'GuideWise API', upstream: 'NCBI Datasets v2' }))

  app.get('/api/genes/:symbol', async (request, response) => {
    const symbol = request.params.symbol.trim()
    const taxon = String(request.query.taxon ?? '').trim()
    const assembly = String(request.query.assembly ?? '').trim() || undefined
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(symbol)) return response.status(400).json({ error: 'Invalid gene symbol or identifier.' })
    if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,99}$/.test(taxon)) return response.status(400).json({ error: 'A valid taxon is required.' })
    if (assembly && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(assembly)) return response.status(400).json({ error: 'Invalid assembly identifier.' })

    const cacheKey = `${symbol.toLocaleUpperCase()}|${taxon.toLocaleLowerCase()}|${assembly?.toLocaleLowerCase() ?? ''}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return response.json({ ...cached.value, source: { ...cached.value.source, cached: true } })

    try {
      const gene = await fetchNcbiGene({ symbol, taxon, assembly, apiKey, timeoutMs, fetchImpl })
      cache.set(cacheKey, { value: gene, expiresAt: Date.now() + cacheTtlMs })
      return response.json(gene)
    } catch (error) {
      if (error instanceof GeneNotFoundError) return response.status(404).json({ error: error.message })
      if (error instanceof GeneRequestTimeoutError) return response.status(504).json({ error: 'NCBI did not respond before the GuideWise timeout.' })
      if (error instanceof MalformedGeneResponseError) return response.status(502).json({ error: 'NCBI returned a response GuideWise could not safely interpret.' })
      if (error instanceof UpstreamGeneError) return response.status(502).json({ error: 'GuideWise could not retrieve gene data from NCBI.' })
      return response.status(500).json({ error: 'Unexpected GuideWise API error.' })
    }
  })

  return app
}
