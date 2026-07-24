import { describe, expect, it } from 'vitest'
import { calculateGcContent, genomicToLocal, isValidDna, localToGenomic, normalizeDna, reverseComplement } from './dna'
import { calculateSpCas9CutPosition, extractSpCas9Guides, findSpCas9PamSites } from './guideGeneration'

describe('DNA utilities', () => {
  it('normalizes case, whitespace, line numbers, and FASTA headers', () => {
    expect(normalizeDna('>demo\n1 acgt acgt\n9 GG')).toBe('ACGTACGTGG')
  })

  it('rejects invalid DNA and recognizes valid DNA', () => {
    expect(isValidDna('ACGT')).toBe(true)
    expect(isValidDna('ACNT')).toBe(false)
    expect(() => normalizeDna('ACNTX')).toThrow(/N, X/)
  })

  it('calculates reverse complements', () => {
    expect(reverseComplement('ATGCCG')).toBe('CGGCAT')
  })

  it('calculates GC content', () => {
    expect(calculateGcContent('GGCCAAAAAA')).toBe(40)
    expect(calculateGcContent('')).toBe(0)
  })

  it('converts local and genomic coordinates', () => {
    expect(localToGenomic(20, 1_000)).toBe(1_020)
    expect(genomicToLocal(1_020, 1_000)).toBe(20)
  })
})

describe('SpCas9 PAM and guide generation', () => {
  it('detects forward-strand NGG PAMs', () => {
    expect(findSpCas9PamSites(`${'A'.repeat(20)}TGG`).some((site) => site.strand === '+' && site.pamStart === 20)).toBe(true)
  })

  it('detects reverse-strand CCN PAM representation', () => {
    const site = findSpCas9PamSites(`CCA${'T'.repeat(20)}`).find((item) => item.strand === '-')
    expect(site).toMatchObject({ strand: '-', pamSequence: 'TGG', pamStart: 0 })
  })

  it('extracts 20-base guides on both strands in 5-prime to 3-prime orientation', () => {
    const sequence = `${'A'.repeat(20)}TGGCCA${'T'.repeat(20)}`
    const guides = extractSpCas9Guides(sequence)
    expect(guides.some((guide) => guide.strand === '+' && guide.sequence === 'A'.repeat(20))).toBe(true)
    expect(guides.some((guide) => guide.strand === '-' && guide.sequence === 'A'.repeat(20))).toBe(true)
  })

  it('calculates approximate strand-aware cut positions', () => {
    expect(calculateSpCas9CutPosition(20, '+')).toBe(17)
    expect(calculateSpCas9CutPosition(0, '-')).toBe(6)
  })
})
