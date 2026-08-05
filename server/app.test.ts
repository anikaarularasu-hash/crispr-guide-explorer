// @vitest-environment node
import type { Server } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from './app.js'

const servers: Server[] = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
})

function ncbiPayload(overrides: Record<string, unknown> = {}) {
  return {
    reports: [{ gene: {
      gene_id: '672', symbol: 'BRCA1', description: 'BRCA1 DNA repair associated', tax_id: '9606', taxname: 'Homo sapiens', common_name: 'human',
      type: 'PROTEIN_CODING', orientation: 'minus', synonyms: ['BRCC1'], ensembl_gene_ids: ['ENSG00000012048'], transcript_count: 368,
      annotations: [{ assembly_accession: 'GCF_000001405.40', assembly_name: 'GRCh38.p14', genomic_locations: [{ genomic_accession_version: 'NC_000017.11', sequence_name: '17', genomic_range: { begin: '43044295', end: '43170327', orientation: 'minus' } }] }],
      summary: [{ description: 'NCBI supplied summary.' }], ...overrides,
    } }], total_count: 1,
  }
}

async function start(app: ReturnType<typeof createApp>) {
  const server = app.listen(0, '127.0.0.1')
  servers.push(server)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind.')
  return `http://127.0.0.1:${address.port}`
}

describe('GuideWise gene API', () => {
  it('reports service health', async () => {
    const base = await start(createApp())
    const response = await fetch(`${base}/api/health`)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', service: 'GuideWise API' })
  })

  it('returns a clean assembly-specific gene instead of raw NCBI data', async () => {
    const upstream = vi.fn(async () => new Response(JSON.stringify(ncbiPayload()), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const base = await start(createApp({ fetchImpl: upstream }))
    const response = await fetch(`${base}/api/genes/BRCA1?taxon=9606&assembly=GRCh38`)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ symbol: 'BRCA1', ncbiGeneId: '672', organism: { taxonId: '9606' }, location: { chromosome: '17', sequenceAccession: 'NC_000017.11', strand: '-' }, availability: { transcripts: 'not_in_gene_report' } })
    expect(body.rawData).toBeUndefined()
  })

  it('rejects invalid symbols and missing taxa before calling NCBI', async () => {
    const upstream = vi.fn()
    const base = await start(createApp({ fetchImpl: upstream }))
    expect((await fetch(`${base}/api/genes/BRCA%201?taxon=9606`)).status).toBe(400)
    expect((await fetch(`${base}/api/genes/BRCA1`)).status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown organism-specific gene', async () => {
    const upstream = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ reports: [], total_count: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const base = await start(createApp({ fetchImpl: upstream }))
    const response = await fetch(`${base}/api/genes/BRCA1?taxon=10090&assembly=GRCm39`)
    expect(response.status).toBe(404)
    expect(String(upstream.mock.calls[0][0])).toContain('/taxon/10090/')
  })

  it('maps upstream failure and malformed responses to safe 502 errors', async () => {
    const failureBase = await start(createApp({ fetchImpl: async () => new Response('bad gateway', { status: 503 }) }))
    expect((await fetch(`${failureBase}/api/genes/BRCA1?taxon=9606`)).status).toBe(502)
    const malformedBase = await start(createApp({ fetchImpl: async () => new Response(JSON.stringify({ reports: [{}] }), { status: 200 }) }))
    expect((await fetch(`${malformedBase}/api/genes/BRCA1?taxon=9606`)).status).toBe(502)
  })

  it('returns 504 when the NCBI request exceeds the timeout', async () => {
    const upstream = vi.fn((_input: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const base = await start(createApp({ fetchImpl: upstream, timeoutMs: 5 }))
    expect((await fetch(`${base}/api/genes/BRCA1?taxon=9606`)).status).toBe(504)
  })

  it('serves repeated requests from the in-memory cache', async () => {
    const upstream = vi.fn(async () => new Response(JSON.stringify(ncbiPayload()), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const base = await start(createApp({ fetchImpl: upstream, cacheTtlMs: 60_000 }))
    await fetch(`${base}/api/genes/BRCA1?taxon=9606&assembly=GRCh38`)
    const second = await (await fetch(`${base}/api/genes/BRCA1?taxon=9606&assembly=GRCh38`)).json()
    expect(upstream).toHaveBeenCalledTimes(1)
    expect(second.source.cached).toBe(true)
  })

  it('marks optional and assembly-dependent fields unavailable rather than inventing them', async () => {
    const upstream = vi.fn(async () => new Response(JSON.stringify(ncbiPayload({ annotations: undefined, transcript_count: undefined, synonyms: undefined, summary: undefined })), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const base = await start(createApp({ fetchImpl: upstream }))
    const body = await (await fetch(`${base}/api/genes/BRCA1?taxon=9606&assembly=GRCh38`)).json()
    expect(body).toMatchObject({ location: null, transcriptCount: null, transcripts: null, summary: null, aliases: [], availability: { location: 'assembly_not_found' } })
  })
})
