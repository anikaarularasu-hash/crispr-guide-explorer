import { describe, expect, it } from 'vitest'
import { toCsv } from './export'
import { createRankedGuides } from '../biology/candidateFactory'
import { genes, getGeneTranscripts } from '../data/mockData'

const gene = genes[0]
const guide = createRankedGuides(gene, getGeneTranscripts(gene.id)[0], 'knockout', gene.genomicStart + 56, [-400, -50])[0]
const record = {
  projectName: 'HBB, "pilot"',
  date: '2026-07-23',
  experimentType: 'knockout' as const,
  organism: 'Homo sapiens',
  assembly: 'GRCh38',
  gene: 'HBB',
  transcript: 'ENST-HBB-001',
  targetLocation: {
    assemblyId: gene.assembly,
    chromosomeLabel: gene.chromosome,
    sequenceAccession: gene.sequenceAccession,
    start: gene.genomicStart,
    end: gene.genomicEnd,
    strand: gene.strand,
  },
  nuclease: 'SpCas9',
  guide,
  mockData: true,
  softwareVersion: '0.2.0',
}

describe('CSV export', () => {
  it('includes required scientific and mock-data fields', () => {
    const csv = toCsv([record])
    expect(csv).toContain('guideSequence')
    expect(csv).toContain('activityModel')
    expect(csv).toContain('mockDataStatus')
    expect(csv).toContain('sequenceAccession')
    expect(csv).toContain('NC_000011.10')
    expect(csv).toContain('Demonstration data active')
  })

  it('properly escapes commas and quotes', () => {
    expect(toCsv([record])).toContain('"HBB, ""pilot"""')
  })
})
