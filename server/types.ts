export interface ExternalDataSource {
  provider: 'NCBI Datasets'
  apiVersion: 'v2'
  endpoint: string
  retrievedAt: string
  cached: boolean
}

export interface Exon {
  start: number
  end: number
  strand: '+' | '-'
}

export interface Transcript {
  id: string
  type: string | null
  exons: Exon[] | null
}

export interface GenomicLocation {
  assemblyName: string
  assemblyAccession: string
  chromosome: string
  sequenceAccession: string
  start: number
  end: number
  strand: '+' | '-'
  coordinateSystem: 'NCBI Datasets gene report (unconverted)'
}

export interface GuideWiseGene {
  ncbiGeneId: string
  symbol: string
  name: string
  organism: { taxonId: string; scientificName: string; commonName: string | null }
  geneType: string | null
  aliases: string[]
  ensemblGeneIds: string[]
  location: GenomicLocation | null
  transcriptCount: number | null
  transcripts: Transcript[] | null
  summary: string | null
  availability: {
    location: 'available' | 'assembly_not_requested' | 'assembly_not_found'
    transcripts: 'not_in_gene_report'
    exons: 'not_in_gene_report'
  }
  source: ExternalDataSource
}
