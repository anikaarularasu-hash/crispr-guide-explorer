import { describe, expect, it } from 'vitest'
import { generateWarnings } from './warnings'

const base = {
  gcContent: 50,
  sequence: 'ACGTACGTACGTACGTACGT',
  codingStatus: 'coding' as const,
  transcriptCoverage: 100,
  proteinPosition: 50,
  distanceFromEdit: 2,
  distanceFromTss: -100,
  offTargetCandidates: [],
}

describe('structured guide warnings', () => {
  it.each([
    [{ ...base, gcContent: 30 }, 'low-gc'],
    [{ ...base, gcContent: 65 }, 'high-gc'],
    [{ ...base, codingStatus: 'intron' as const }, 'intronic'],
    [{ ...base, transcriptCoverage: 40 }, 'low-coverage'],
    [{ ...base, proteinPosition: 92 }, 'late-exon'],
    [{ ...base, distanceFromEdit: 40 }, 'far-from-edit'],
  ])('generates expected warning', (guide, type) => {
    const experiment = type === 'far-from-edit' ? 'knockin' : 'knockout'
    expect(generateWarnings(guide, experiment).some((item) => item.type === type)).toBe(true)
  })

  it('warns outside a configured TSS window', () => {
    expect(generateWarnings({ ...base, distanceFromTss: 400 }, 'crispra', { tssWindow: [-400, -50] }).some((item) => item.type === 'outside-tss-window')).toBe(true)
  })

  it('warns about knock-in recutting risk', () => {
    expect(generateWarnings(base, 'knockin').some((item) => item.type === 'recutting-risk')).toBe(true)
  })

  it('always discloses mock data', () => {
    expect(generateWarnings(base, 'knockout').some((item) => item.type === 'mock-data')).toBe(true)
  })
})
