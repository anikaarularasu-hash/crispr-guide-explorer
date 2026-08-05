import { describe, expect, it } from 'vitest'
import { geneLocation, validateBiologicalTarget } from './targeting'
import { resolveGeneRecords } from '../data/mockData'
import type { BiologicalTarget } from '../types/crispr'

describe('assembly-safe biological targeting', () => {
  it('resolves human and mouse genes through their own annotations', () => {
    const human = resolveGeneRecords('human', 'GRCh38', 'TP53')[0]
    const mouse = resolveGeneRecords('mouse', 'GRCm39', 'Trp53')[0]
    expect(geneLocation(human)).toMatchObject({ assemblyId: 'GRCh38', chromosomeLabel: '17', sequenceAccession: 'NC_000017.11' })
    expect(geneLocation(mouse)).toMatchObject({ assemblyId: 'GRCm39', chromosomeLabel: '11', sequenceAccession: 'NC_000077.7' })
    expect(mouse.genomicStart).not.toBe(human.genomicStart)
  })

  it('changes coordinates and accessions when the human assembly changes', () => {
    const current = resolveGeneRecords('human', 'GRCh38', 'HBB')[0]
    const legacy = resolveGeneRecords('human', 'GRCh37', 'HBB')[0]
    expect(legacy.genomicStart).not.toBe(current.genomicStart)
    expect(legacy.sequenceAccession).not.toBe(current.sequenceAccession)
  })

  it('returns no annotation for an unknown gene instead of guessing', () => {
    expect(resolveGeneRecords('human', 'GRCh38', 'NOT_A_GENE')).toEqual([])
  })

  it('requires a sequence identifier and valid coordinates in region mode', () => {
    const target: BiologicalTarget = { inputMode: 'genomic_region', organismId: 'human', assemblyId: 'GRCh38', location: { assemblyId: 'GRCh38', chromosomeLabel: '', start: 0, end: 0, strand: '+' } }
    expect(validateBiologicalTarget(target)).toEqual(expect.arrayContaining(['Enter a chromosome or sequence identifier.', 'Enter a valid start coordinate.', 'Enter a valid end coordinate.']))
  })

  it('does not invent location or transcript metadata for raw sequence', () => {
    const target: BiologicalTarget = { inputMode: 'raw_sequence', organismId: 'human', assemblyId: '', rawSequence: 'ACGTACGT' }
    expect(validateBiologicalTarget(target)).toEqual([])
    expect(target.location).toBeUndefined()
    expect(target.transcriptId).toBeUndefined()
  })
})
