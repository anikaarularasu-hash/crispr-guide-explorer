export type ExperimentType = 'knockout' | 'knockin' | 'crispra' | 'crispri'
export type Strand = '+' | '-'
export type WarningSeverity = 'information' | 'caution' | 'high'
export type CodingStatus = 'coding' | 'utr' | 'intron' | 'promoter'

export interface Organism {
  id: 'human' | 'mouse'
  scientificName: string
  commonName: string
  assemblies: GenomeAssembly[]
}

export interface GenomeAssembly {
  id: 'GRCh38' | 'GRCm39'
  label: string
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
  proteinCoding: boolean
  canonical: boolean
  exonCount: number
  codingSequenceLength: number
  exons: Exon[]
  tissueExpression?: string
}

export interface Gene {
  id: string
  symbol: 'HBB' | 'CFTR' | 'PCSK9' | 'TP53'
  name: string
  chromosome: string
  genomicStart: number
  genomicEnd: number
  strand: Strand
  assembly: GenomeAssembly['id']
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
  id: 'spcas9' | 'spcas9-hf1' | 'espcas9' | 'sacas9'
  name: string
  fullName: string
  pam: PamRule
  catalyticallyActive: boolean
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
  nuclease: string
  guide: RankedGuide
  mockData: boolean
  softwareVersion: string
}

export interface SequenceProvider {
  getSequence(geneId: string): Promise<string>
}

export interface TranscriptProvider {
  getTranscripts(geneId: string): Promise<Transcript[]>
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
