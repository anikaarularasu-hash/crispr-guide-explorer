import type { GuideWiseGene, GenomicLocation } from './types.js'

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

interface NcbiRange { begin?: string | number; end?: string | number; orientation?: string }
interface NcbiLocation { genomic_accession_version?: string; sequence_name?: string; genomic_range?: NcbiRange }
interface NcbiAnnotation { assembly_accession?: string; assembly_name?: string; genomic_locations?: NcbiLocation[] }
interface NcbiGene {
  gene_id?: string; symbol?: string; description?: string; tax_id?: string; taxname?: string; common_name?: string
  type?: string; orientation?: string; chromosomes?: string[]; synonyms?: string[]; ensembl_gene_ids?: string[]
  annotations?: NcbiAnnotation[]; transcript_count?: number; summary?: Array<{ description?: string }>
}
interface NcbiResponse { reports?: Array<{ gene?: NcbiGene; query?: string[] }>; total_count?: number }

export class GeneNotFoundError extends Error {}
export class UpstreamGeneError extends Error {}
export class MalformedGeneResponseError extends Error {}
export class GeneRequestTimeoutError extends Error {}

function strand(value?: string): '+' | '-' {
  return value?.toLocaleLowerCase() === 'minus' ? '-' : '+'
}

function matchesAssembly(annotation: NcbiAnnotation, requested: string): boolean {
  const normalized = requested.trim().toLocaleLowerCase()
  return [annotation.assembly_name, annotation.assembly_accession]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase() === normalized || value!.toLocaleLowerCase().startsWith(`${normalized}.`))
}

function locationFrom(annotation: NcbiAnnotation): GenomicLocation | null {
  const location = annotation.genomic_locations?.[0]
  const range = location?.genomic_range
  const start = Number(range?.begin)
  const end = Number(range?.end)
  if (!annotation.assembly_name || !annotation.assembly_accession || !location?.sequence_name || !location.genomic_accession_version || !Number.isFinite(start) || !Number.isFinite(end)) return null
  return {
    assemblyName: annotation.assembly_name,
    assemblyAccession: annotation.assembly_accession,
    chromosome: location.sequence_name,
    sequenceAccession: location.genomic_accession_version,
    start,
    end,
    strand: strand(range?.orientation),
    coordinateSystem: 'NCBI Datasets gene report (unconverted)',
  }
}

export async function fetchNcbiGene({
  symbol,
  taxon,
  assembly,
  apiKey,
  timeoutMs = 8_000,
  fetchImpl = globalThis.fetch,
}: {
  symbol: string
  taxon: string
  assembly?: string
  apiKey?: string
  timeoutMs?: number
  fetchImpl?: FetchLike
}): Promise<GuideWiseGene> {
  const endpoint = `https://api.ncbi.nlm.nih.gov/datasets/v2/gene/symbol/${encodeURIComponent(symbol)}/taxon/${encodeURIComponent(taxon)}/dataset_report`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetchImpl(endpoint, { headers: { Accept: 'application/json', ...(apiKey ? { 'api-key': apiKey } : {}) }, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw new GeneRequestTimeoutError('NCBI request timed out.')
    throw new UpstreamGeneError(error instanceof Error ? error.message : 'NCBI request failed.')
  } finally {
    clearTimeout(timeout)
  }

  if (response.status === 404) throw new GeneNotFoundError(`Gene ${symbol} was not found for taxon ${taxon}.`)
  if (!response.ok) throw new UpstreamGeneError(`NCBI returned HTTP ${response.status}.`)

  let data: NcbiResponse
  try { data = await response.json() as NcbiResponse } catch { throw new MalformedGeneResponseError('NCBI returned malformed JSON.') }
  const gene = data.reports?.[0]?.gene
  if (!gene && data.total_count === 0) throw new GeneNotFoundError(`Gene ${symbol} was not found for taxon ${taxon}.`)
  if (!gene?.gene_id || !gene.symbol || !gene.description || !gene.tax_id || !gene.taxname) throw new MalformedGeneResponseError('NCBI response is missing required gene fields.')

  const annotation = assembly ? gene.annotations?.find((item) => matchesAssembly(item, assembly)) : undefined
  const location = annotation ? locationFrom(annotation) : null
  const locationAvailability = !assembly ? 'assembly_not_requested' : location ? 'available' : 'assembly_not_found'
  return {
    ncbiGeneId: gene.gene_id,
    symbol: gene.symbol,
    name: gene.description,
    organism: { taxonId: gene.tax_id, scientificName: gene.taxname, commonName: gene.common_name ?? null },
    geneType: gene.type ?? null,
    aliases: gene.synonyms ?? [],
    ensemblGeneIds: gene.ensembl_gene_ids ?? [],
    location,
    transcriptCount: typeof gene.transcript_count === 'number' ? gene.transcript_count : null,
    transcripts: null,
    summary: gene.summary?.[0]?.description ?? null,
    availability: { location: locationAvailability, transcripts: 'not_in_gene_report', exons: 'not_in_gene_report' },
    source: { provider: 'NCBI Datasets', apiVersion: 'v2', endpoint, retrievedAt: new Date().toISOString(), cached: false },
  }
}
