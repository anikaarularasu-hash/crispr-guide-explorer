import type {
  CandidateGuide,
  ExperimentType,
  GuideScores,
  RankedGuide,
  RankingWeights,
} from '../types/crispr'

export const defaultWeights: Record<ExperimentType, RankingWeights> = {
  knockout: { activity: 25, specificity: 25, transcriptCoverage: 20, location: 15, functional: 15 },
  knockin: { activity: 20, specificity: 25, location: 35, recutting: 10, donor: 10 },
  crispra: { activity: 20, specificity: 25, location: 40, confidence: 15 },
  crispri: { activity: 20, specificity: 25, location: 40, confidence: 15 },
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

export function normalizeWeights(weights: RankingWeights): RankingWeights {
  const total = Object.values(weights).reduce((sum, value) => sum + (value ?? 0), 0)
  if (total <= 0) throw new Error('At least one ranking weight must be greater than zero.')
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, ((value ?? 0) / total) * 100])) as unknown as RankingWeights
}

export function gcSuitability(gc: number): number {
  return clamp(100 - Math.abs(gc - 50) * 3)
}

export function deterministicActivity(sequence: string, gc: number): number {
  const seedGc = (sequence.slice(12).match(/[GC]/g) ?? []).length
  const homopolymerPenalty = /(A{4,}|C{4,}|G{4,}|T{4,})/.test(sequence) ? 15 : 0
  return Math.round(clamp(45 + gcSuitability(gc) * 0.35 + seedGc * 1.6 - homopolymerPenalty))
}

export function deterministicSpecificity(sequence: string): number {
  const repeatedDinucleotide = /(..)\1\1/.test(sequence) ? 9 : 0
  const homopolymer = /(A{4,}|C{4,}|G{4,}|T{4,})/.test(sequence) ? 14 : 0
  const seedDiversity = new Set(sequence.slice(10)).size * 2
  return Math.round(clamp(72 + seedDiversity - repeatedDinucleotide - homopolymer))
}

function warningPenalty(guide: CandidateGuide): number {
  return guide.warnings.reduce((total, item) => total + (item.changesRanking ? item.severity === 'high' ? 12 : item.severity === 'caution' ? 5 : 1 : 0), 0)
}

export function scoreGuide(guide: CandidateGuide, experiment: ExperimentType, weights = defaultWeights[experiment]): GuideScores {
  const normalized = normalizeWeights(weights)
  const distanceScore = guide.distanceFromEdit == null ? guide.experimentLocationScore : clamp(100 - guide.distanceFromEdit * 3)
  const location = experiment === 'knockin' ? distanceScore : guide.experimentLocationScore
  const penalty = warningPenalty(guide)
  const components: Array<[number, number | undefined]> = [
    [guide.onTargetScore, normalized.activity],
    [guide.specificityScore, normalized.specificity],
    [guide.transcriptCoverage, normalized.transcriptCoverage],
    [location, normalized.location],
    [guide.functionalSuitabilityScore, normalized.functional],
    [guide.warnings.some((item) => item.type.includes('recutting')) ? 35 : 82, normalized.recutting],
    [guide.distanceFromEdit != null && guide.distanceFromEdit <= 10 ? 88 : 58, normalized.donor],
    [guide.transcriptCoverage, normalized.confidence],
  ]
  const weighted = components.reduce((sum, [value, weight]) => sum + value * ((weight ?? 0) / 100), 0)
  return {
    onTarget: guide.onTargetScore,
    specificity: guide.specificityScore,
    transcriptCoverage: guide.transcriptCoverage,
    experimentLocation: location,
    functionalSuitability: guide.functionalSuitabilityScore,
    exonSuitability: guide.codingStatus === 'coding' ? 90 : guide.codingStatus === 'promoter' ? 65 : 30,
    recuttingAvoidance: guide.warnings.some((item) => item.type.includes('recutting')) ? 35 : 82,
    donorCompatibility: guide.distanceFromEdit != null && guide.distanceFromEdit <= 10 ? 88 : 58,
    tssConfidence: guide.transcriptCoverage,
    warningPenalty: penalty,
    overall: Math.round(clamp(weighted - penalty)),
  }
}

export function rankGuides(guides: CandidateGuide[], experiment: ExperimentType, weights = defaultWeights[experiment]): RankedGuide[] {
  return guides
    .map((guide) => {
      const scores = scoreGuide(guide, experiment, weights)
      return { ...guide, overallScore: scores.overall, scores, rank: 0 }
    })
    .sort((a, b) => b.scores.overall - a.scores.overall || b.specificityScore - a.specificityScore)
    .map((guide, index) => ({ ...guide, rank: index + 1 }))
}
