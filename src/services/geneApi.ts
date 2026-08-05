export interface ApiGeneLocation {
  assemblyName: string
  assemblyAccession: string
  chromosome: string
  sequenceAccession: string
  start: number
  end: number
  strand: '+' | '-'
  coordinateSystem: string
}

export interface ApiGene {
  ncbiGeneId: string
  symbol: string
  name: string
  organism: { taxonId: string; scientificName: string; commonName: string | null }
  geneType: string | null
  aliases: string[]
  ensemblGeneIds: string[]
  location: ApiGeneLocation | null
  transcriptCount: number | null
  transcripts: null
  summary: string | null
  availability: { location: 'available' | 'assembly_not_requested' | 'assembly_not_found'; transcripts: 'not_in_gene_report'; exons: 'not_in_gene_report' }
  source: { provider: 'NCBI Datasets'; apiVersion: 'v2'; endpoint: string; retrievedAt: string; cached: boolean }
}

export class GeneApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'GeneApiError'
  }
}

export async function fetchGene(symbol: string, taxon: string, assembly?: string, signal?: AbortSignal): Promise<ApiGene> {
  const query = new URLSearchParams({ taxon })
  if (assembly) query.set('assembly', assembly)
  const response = await fetch(`/api/genes/${encodeURIComponent(symbol)}?${query}`, { signal, headers: { Accept: 'application/json' } })
  const data = await response.json() as ApiGene | { error?: string }
  if (!response.ok) throw new GeneApiError('error' in data && data.error ? data.error : 'Gene lookup failed.', response.status)
  return data as ApiGene
}
