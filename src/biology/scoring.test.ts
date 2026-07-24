import { describe, expect, it } from 'vitest'
import { createRankedGuides } from './candidateFactory'
import { defaultWeights, rankGuides, scoreGuide } from './scoring'
import { genes, getGeneTranscripts } from '../data/mockData'
import type { RankedGuide } from '../types/crispr'

const gene = genes[0]
const transcript = getGeneTranscripts(gene.id)[0]
const knockout = createRankedGuides(gene, transcript, 'knockout', gene.genomicStart + 56, [-400, -50])

describe('experiment-aware scoring', () => {
  it('returns ranked knockout, knock-in, CRISPRa, and CRISPRi guides', () => {
    for (const experiment of ['knockout', 'knockin', 'crispra', 'crispri'] as const) {
      const guides = createRankedGuides(gene, transcript, experiment, gene.genomicStart + 56, [20, 120])
      expect(guides.length).toBeGreaterThan(2)
      expect(guides[0].rank).toBe(1)
      expect(guides[0].overallScore).toBeGreaterThanOrEqual(guides[1].overallScore)
    }
  })

  it('changing experiment changes ranking inputs or order', () => {
    const knockin = createRankedGuides(gene, transcript, 'knockin', gene.genomicStart + 56, [-400, -50])
    expect(knockin.map((guide) => guide.experimentLocationScore)).not.toEqual(knockout.map((guide) => guide.experimentLocationScore))
  })

  it('cut-to-edit distance strongly affects knock-in ranking', () => {
    const base = knockout[0]
    const close = { ...base, id: 'close', distanceFromEdit: 2, warnings: [] }
    const far = { ...base, id: 'far', distanceFromEdit: 24, onTargetScore: base.onTargetScore + 5, warnings: [] }
    expect(rankGuides([far, close], 'knockin')[0].id).toBe('close')
  })

  it('specificity affects every experiment ranking', () => {
    const base = knockout[0]
    const high = { ...base, id: 'high', specificityScore: 99, warnings: [] }
    const low = { ...base, id: 'low', specificityScore: 20, warnings: [] }
    for (const experiment of ['knockout', 'knockin', 'crispra', 'crispri'] as const) {
      expect(rankGuides([low, high], experiment)[0].id).toBe('high')
    }
  })

  it('transcript coverage affects knockout scoring', () => {
    const base = knockout[0]
    const full = { ...base, id: 'full', transcriptCoverage: 100, warnings: [] }
    const partial = { ...base, id: 'partial', transcriptCoverage: 20, warnings: [] }
    expect(rankGuides([partial, full], 'knockout')[0].id).toBe('full')
  })

  it('warning penalties lower a guide score', () => {
    const base = { ...knockout[0], warnings: [] } as RankedGuide
    const warned = { ...base, warnings: [{ type: 'risk', severity: 'high' as const, title: 'Risk', explanation: '', evidence: '', interpretation: '', changesRanking: true }] }
    expect(scoreGuide(warned, 'knockout').overall).toBeLessThan(scoreGuide(base, 'knockout').overall)
  })

  it('user-adjusted weights change scoring', () => {
    const guide = knockout[0]
    const activityOnly = scoreGuide(guide, 'knockout', { ...defaultWeights.knockout, activity: 100, specificity: 0, transcriptCoverage: 0, location: 0, functional: 0 })
    const specificityOnly = scoreGuide(guide, 'knockout', { ...defaultWeights.knockout, activity: 0, specificity: 100, transcriptCoverage: 0, location: 0, functional: 0 })
    expect(activityOnly.overall).not.toBe(specificityOnly.overall)
  })
})
