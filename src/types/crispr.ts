export type ExperimentType = 'knockout' | 'knockin' | 'crispra' | 'crispri'
export type ExperimentContext =
  | 'cultured_cell_knockout'
  | 'crispr_screen'
  | 'exploratory_research'
  | 'primary_cells'
  | 'stem_cells'
  | 'transplantation_cells'
  | 'preclinical_therapy'
  | 'clinical_therapy'
  | 'high_off_target_risk'
  | 'other'
export type EditingPriority =
  | 'maximize_activity'
  | 'minimize_off_targets'
  | 'balanced'
  | 'established_system'
  | 'small_delivery'
  | 'alternative_pam'
  | 'unsure'
export type SafetyContext = 'research_only' | 'possible_therapy' | 'preclinical' | 'clinical' | 'unsure'
export type NucleaseId = 'spcas9' | 'sniper-cas9' | 'spcas9-hf1' | 'espcas9' | 'hifi-cas9' | 'sacas9' | 'cas12a' | 'other'
export type Strand = '+' | '-'
export type WarningSeverity = 'information' | 'caution' | 'high'
export type CodingStatus = 'coding' | 'utr' | 'intron' | 'promoter'
export type OrganismCategory = 'mammals' | 'fish' | 'insects' | 'nematodes' | 'plants' | 'fungi' | 'bacteria' | 'synthetic'
export type ExampleGeneCategory = 'blood_disorders' | 'cancer' | 'cardiovascular' | 'neurological' | 'muscle_disorders' | 'metabolic_liver' | 'lung_epithelial' | 'immune_system' | 'vision' | 'basic_research'
export type GenomeOrganization = 'eukaryotic' | 'prokaryotic'
export type DataProvenance = 'demonstration' | 'uploaded' | 'remote-reference'
export type TargetInputMode = 'gene' | 'transcript' | 'genomic_region' | 'raw_sequence' | 'custom_genome'

export interface GenomicLocation {
  assemblyId: string
  chromosomeLabel: string
  sequenceAccession?: string
  start: number
  end: number
  strand: Strand
}

export interface BiologicalTarget {
  inputMode: TargetInputMode
  organismId: string
  assemblyId: string
  geneId?: string
  geneSymbol?: string
  transcriptId?: string
  location?: GenomicLocation
  rawSequence?: string
}

export interface Organism {
  id: string
  ncbiTaxonId?: string
  scientificName: string
  commonName: string
  category: OrganismCategory
  genomeOrganization: GenomeOrganization
  supportsTranscriptAnalysis: boolean
  supportsAlternativeSplicing: boolean
  annotationNote: string
  assemblies: GenomeAssembly[]
}

export interface GenomeAssembly {
  id: string
  label: string
  accession?: string
  source: string
  provenance: DataProvenance
}

export interface Exon {
  id: string
  number: number
  genomicStart: number
  genomicEnd: number
  codingStatus: CodingStatus
  transcriptIds: string[]
  proteinStart?: number
  proteinEnd?: number
  constitutive: boolean
}

export interface Intron {
  id: string
  genomicStart: number
  genomicEnd: number
}

export interface ProteinDomain {
  id: string
  name: string
  proteinStart: number
  proteinEnd: number
  source: 'demonstration'
}

export interface Transcript {
  id: string
  geneId: string
  organismId: string
  assemblyId: string
  proteinCoding: boolean
  canonical: boolean
  exonCount: number
  codingSequenceLength: number
  exons: Exon[]
  tissueExpression?: string
}

export interface Gene {
  id: string
  organismId: string
  symbol: string
  ensemblGeneId?: string
  ncbiGeneId?: string
  refSeqIds?: string[]
  geneType: string
  exampleCategory?: ExampleGeneCategory
  name: string
  chromosome: string
  sequenceAccession?: string
  genomicStart: number
  genomicEnd: number
  strand: Strand
  assembly: GenomeAssembly['id']
  genomeOrganization: GenomeOrganization
  transcriptIds: string[]
  sequence: string
  transcriptionStartSite: number
  domains: ProteinDomain[]
}

export interface PamRule {
  pattern: string
  guideLength: number
  pamLength: number
  cutOffsetFromPam: number
}

export interface Nuclease {
  id: NucleaseId
  name: string
  fullName: string
  pam: PamRule
  catalyticallyActive: boolean
}

export interface NucleaseRecommendation {
  primaryRecommendation: string
  recommendedNucleaseId?: NucleaseId
  alternatives: string[]
  reasons: string[]
  cautions: string[]
  nextStep: string
  confidence: 'low' | 'moderate' | 'high'
  dataBasis: 'context-only' | 'demonstration-guide-data' | 'real-guide-data'
}

export interface OffTargetCandidate {
  chromosome: string
  position: number
  strand: Strand
  sequence: string
  pam: string
  mismatches: number
  mismatchPositions: number[]
  bulges?: number
  annotation: 'coding exon' | 'intron' | 'promoter' | 'intergenic'
  gene?: string
  codingConsequence?: string
  riskScore: number
  importantGene: boolean
  compatiblePam: boolean
  simulated: true
}

export interface GuideWarning {
  type: string
  severity: WarningSeverity
  title: string
  explanation: string
  evidence: string
  interpretation: string
  changesRanking: boolean
}

export interface ScientificModelMetadata {
  name: string
  version: string
  evidenceLevel: 'demonstration' | 'heuristic' | 'validated-model' | 'experimental'
  publication?: string
  applicableNuclease: string
  guideLength: number
  organismContext: string
  trainingContext: string
  outputRange: string
  interpretation: string
  limitations: string
}

export interface GuideScores {
  onTarget: number
  specificity: number
  transcriptCoverage: number
  experimentLocation: number
  functionalSuitability: number
  exonSuitability: number
  recuttingAvoidance: number
  donorCompatibility: number
  tssConfidence: number
  warningPenalty: number
  overall: number
}

export interface CandidateGuide {
  id: string
  sequence: string
  pam: string
  pamSequence: string
  strand: Strand
  chromosome: string
  genomicStart: number
  genomicEnd: number
  cutPosition: number
  gcContent: number
  exonId?: string
  exonNumber?: number
  intronId?: string
  transcriptIds: string[]
  codingStatus: CodingStatus
  proteinPosition?: number
  proteinDomain?: string
  distanceFromTss: number
  distanceFromEdit?: number
  onTargetScore: number
  specificityScore: number
  transcriptCoverage: number
  experimentLocationScore: number
  functionalSuitabilityScore: number
  overallScore: number
  offTargetCandidates: OffTargetCandidate[]
  warnings: GuideWarning[]
  explanation: string
  scoringModelMetadata: ScientificModelMetadata
}

export interface RankingWeights {
  activity: number
  specificity: number
  transcriptCoverage?: number
  location: number
  functional?: number
  recutting?: number
  donor?: number
  confidence?: number
}

export interface KnockoutConfiguration {
  sharedExons: boolean
  avoidFirstCodingExon: boolean
  avoidFinalCodingExon: boolean
  minimumTranscriptCoverage: number
  preferProteinDomains: boolean
  desiredGuides: number
  multipleGuides: boolean
}

export interface KnockinConfiguration {
  editPosition: number
  referenceAllele: string
  desiredAllele: string
  editType: 'substitution' | 'insertion' | 'deletion'
  donorType: 'ssODN' | 'dsDNA' | 'plasmid'
  maximumCutDistance: number
  silentChangesAllowed: boolean
  disruptPam: boolean
  disruptGuide: boolean
  protectFromRecutting: boolean
}

export interface CrisprAConfiguration {
  tss: number
  windowStart: number
  windowEnd: number
  effector: string
  desiredGuides: number
  multipleGuides: boolean
  cellType?: string
}

export interface CrisprIConfiguration extends CrisprAConfiguration {}

export type ExperimentConfiguration =
  | KnockoutConfiguration
  | KnockinConfiguration
  | CrisprAConfiguration
  | CrisprIConfiguration

export interface RankedGuide extends CandidateGuide {
  rank: number
  scores: GuideScores
}

export interface ExportRecord {
  projectName: string
  date: string
  experimentType: ExperimentType
  organism: string
  assembly: string
  gene: string
  transcript: string
  targetLocation: GenomicLocation
  nuclease: string
  guide: RankedGuide
  mockData: boolean
  softwareVersion: string
}

export interface SequenceProvider {
  getSequence(request: { organismId: string; assemblyId: string; geneId: string }): Promise<string>
}

export interface TranscriptProvider {
  getTranscripts(request: { organismId: string; assemblyId: string; geneId: string }): Promise<Transcript[]>
}

export interface GeneAnnotationProvider {
  getGenes(request: { organismId: string; assemblyId: string }): Promise<Gene[]>
  resolveGenes(request: { organismId: string; assemblyId: string; query: string }): Promise<Gene[]>
}

export interface GeneProvider {
  id: string
  provenance: DataProvenance
  searchGenes(request: { organismId: string; assemblyId: string; query: string; limit?: number }): Promise<Gene[]>
  getGene(request: { organismId: string; assemblyId: string; geneId: string }): Promise<Gene | undefined>
  getExampleGenes(request: { organismId: string; assemblyId: string }): Promise<Gene[]>
}

export interface GenomeDataProvider extends SequenceProvider, TranscriptProvider, GeneAnnotationProvider {
  id: string
  provenance: DataProvenance
  getOrganisms(): Promise<Organism[]>
}

export interface CustomGenomeUpload {
  organismName: string
  assemblyName: string
  fastaFile: File
  annotationFile?: File
  annotationFormat?: 'gtf' | 'gff3'
}

export interface ProteinAnnotationProvider {
  getDomains(geneId: string): Promise<ProteinDomain[]>
}

export interface OnTargetScoringProvider {
  score(guide: CandidateGuide): Promise<{ score: number; metadata: ScientificModelMetadata }>
}

export interface OffTargetSearchProvider {
  search(guide: CandidateGuide): Promise<OffTargetCandidate[]>
}

export interface VariantProvider {
  getVariants(geneId: string): Promise<unknown[]>
}
