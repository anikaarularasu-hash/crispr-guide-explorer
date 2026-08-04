import { extractSpCas9Guides } from './guideGeneration'
import { deterministicActivity, deterministicSpecificity, rankGuides } from './scoring'
import { generateWarnings } from './warnings'
import { explainGuide } from './explanations'
import type { CandidateGuide, ExperimentType, Gene, RankedGuide, Transcript } from '../types/crispr'

const metadata = {
  name: 'GuideWise sequence heuristic',
  version: '0.2.0',
  evidenceLevel: 'heuristic' as const,
  applicableNuclease: 'SpCas9, demonstration only',
  guideLength: 20,
  organismContext: 'No organism-specific training',
  trainingContext: 'Rule-based; not machine-learned and not trained on experimental outcomes',
  outputRange: '0–100 relative heuristic scale',
  interpretation: 'Higher values reflect favorable encoded sequence features within this prototype.',
  limitations: 'Not a validated prediction, not an editing percentage, and excludes chromatin, cell type, delivery, and genome-wide off-target analysis.',
}

export function createRankedGuides(
  gene: Gene,
  transcript: Transcript,
  experiment: ExperimentType,
  editPosition: number,
  tssWindow: [number, number],
  nucleaseId = 'spcas9',
): RankedGuide[] {
  const extracted = extractSpCas9Guides(gene.sequence).slice(0, 18)
  const candidates: CandidateGuide[] = extracted.map((guide, index) => {
    const genomicStart = gene.genomicStart + guide.localStart
    const genomicEnd = gene.genomicStart + guide.localEnd
    const cutPosition = gene.genomicStart + guide.cutPosition
    const exon = transcript.exons.find((item) => guide.localStart >= item.genomicStart && guide.localStart <= item.genomicEnd)
    const prokaryotic = gene.genomeOrganization === 'prokaryotic'
    const coverage = prokaryotic ? 100 : exon?.constitutive ? 100 : exon ? 50 : 35
    const codingStatus = prokaryotic ? 'coding' : exon?.codingStatus ?? (guide.localStart < 32 ? 'promoter' : 'intron')
    const proteinPosition = exon?.proteinStart && exon.proteinEnd ? Math.round(((exon.proteinStart + exon.proteinEnd) / 2 / 149) * 100) : undefined
    const domain = gene.domains.find((item) => proteinPosition != null && proteinPosition >= (item.proteinStart / 149) * 100 && proteinPosition <= (item.proteinEnd / 149) * 100)
    const distanceFromTss = genomicStart - gene.transcriptionStartSite
    const distanceFromEdit = Math.abs(cutPosition - editPosition)
    const activity = deterministicActivity(guide.sequence, guide.gcContent)
    const specificity = deterministicSpecificity(guide.sequence)
    const offTargets = index % 6 === 3 ? [{
      chromosome: 'chr2',
      position: 20_000_000 + index * 113,
      strand: guide.strand,
      sequence: guide.sequence.slice(0, 18) + 'AA',
      pam: 'TGG',
      mismatches: 2,
      mismatchPositions: [19, 20],
      annotation: 'coding exon' as const,
      gene: 'DEMO1',
      codingConsequence: 'Unknown; simulated record',
      riskScore: 68,
      importantGene: false,
      compatiblePam: true,
      simulated: true as const,
    }] : []
    const base: CandidateGuide = {
      id: `${gene.symbol}-${guide.strand}-${guide.localStart}`,
      sequence: guide.sequence,
      pam: 'NGG',
      pamSequence: guide.pamSequence,
      strand: guide.strand,
      chromosome: `chr${gene.chromosome}`,
      genomicStart,
      genomicEnd,
      cutPosition,
      gcContent: guide.gcContent,
      exonId: exon?.id,
      exonNumber: exon?.number,
      transcriptIds: exon?.transcriptIds ?? [transcript.id],
      codingStatus,
      proteinPosition,
      proteinDomain: domain?.name,
      distanceFromTss,
      distanceFromEdit,
      onTargetScore: activity,
      specificityScore: specificity,
      transcriptCoverage: coverage,
      experimentLocationScore: experiment === 'knockout'
        ? codingStatus === 'coding' ? Math.max(40, 95 - Math.abs((proteinPosition ?? 50) - 50)) : 25
        : experiment === 'knockin'
          ? Math.max(0, 100 - distanceFromEdit * 3)
          : distanceFromTss >= tssWindow[0] && distanceFromTss <= tssWindow[1] ? 95 : 35,
      functionalSuitabilityScore: domain ? 92 : codingStatus === 'coding' ? 76 : 35,
      overallScore: 0,
      offTargetCandidates: offTargets,
      warnings: [],
      explanation: '',
      scoringModelMetadata: {
        ...metadata,
        organismContext: `${gene.organismId} demonstration record; no organism-specific training`,
      },
    }
    base.warnings = generateWarnings(base, experiment, { maximumCutDistance: 20, tssWindow, nucleaseId })
    return base
  })
  return rankGuides(candidates, experiment).map((guide) => ({ ...guide, explanation: explainGuide(guide, experiment) }))
}
