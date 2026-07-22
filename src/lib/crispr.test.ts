import { describe, expect, it } from 'vitest'
import { calculateGcPercentage, findForwardGuides, normalizeSequence } from './crispr'

describe('normalizeSequence', () => {
  it('uppercases bases and removes whitespace and line numbers', () => {
    expect(normalizeSequence('1 atcg atcg\n9 ggtt')).toBe('ATCGATCGGGTT')
  })

  it('rejects characters other than A, T, C, and G', () => {
    expect(() => normalizeSequence('ATCGNX')).toThrow(/Invalid characters: N, X/)
  })
})

describe('findForwardGuides', () => {
  it('detects NGG PAMs on the forward strand', () => {
    const sequence = `${'A'.repeat(20)}TGG${'C'.repeat(20)}AGG`
    expect(findForwardGuides(sequence).map(({ pam, pamPosition }) => ({ pam, pamPosition }))).toEqual([
      { pam: 'TGG', pamPosition: 20 },
      { pam: 'AGG', pamPosition: 43 },
    ])
  })

  it('extracts exactly the 20 bases immediately upstream', () => {
    const guide = 'ATCGATCGATCGATCGATCG'
    expect(findForwardGuides(`TT${guide}CGG`)[0].guide).toBe(guide)
  })

  it('does not return a PAM without 20 upstream bases', () => {
    expect(findForwardGuides('AAAAATGG')).toEqual([])
  })
})

describe('calculateGcPercentage', () => {
  it('calculates GC percentage', () => {
    expect(calculateGcPercentage('GGCCAAAAAA')).toBe(40)
    expect(calculateGcPercentage('')).toBe(0)
  })
})
