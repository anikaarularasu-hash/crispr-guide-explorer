import { calculateGcContent, reverseComplement } from './dna'
import type { Strand } from '../types/crispr'

export interface PamSite {
  strand: Strand
  pamSequence: string
  pamStart: number
}

export interface ExtractedGuide {
  sequence: string
  pamSequence: string
  strand: Strand
  localStart: number
  localEnd: number
  cutPosition: number
  gcContent: number
}

export function findSpCas9PamSites(sequence: string): PamSite[] {
  const upper = sequence.toUpperCase()
  const sites: PamSite[] = []
  for (let index = 0; index <= upper.length - 3; index += 1) {
    const triplet = upper.slice(index, index + 3)
    if (/^[ACGT]GG$/.test(triplet)) sites.push({ strand: '+', pamSequence: triplet, pamStart: index })
    if (/^CC[ACGT]$/.test(triplet)) {
      sites.push({ strand: '-', pamSequence: reverseComplement(triplet), pamStart: index })
    }
  }
  return sites
}

export function calculateSpCas9CutPosition(pamStart: number, strand: Strand): number {
  return strand === '+' ? pamStart - 3 : pamStart + 6
}

export function extractSpCas9Guides(sequence: string): ExtractedGuide[] {
  const upper = sequence.toUpperCase()
  const guides: ExtractedGuide[] = []
  for (const site of findSpCas9PamSites(upper)) {
    if (site.strand === '+' && site.pamStart >= 20) {
      const guide = upper.slice(site.pamStart - 20, site.pamStart)
      guides.push({
        sequence: guide,
        pamSequence: site.pamSequence,
        strand: '+',
        localStart: site.pamStart - 20,
        localEnd: site.pamStart - 1,
        cutPosition: calculateSpCas9CutPosition(site.pamStart, '+'),
        gcContent: calculateGcContent(guide),
      })
    }
    if (site.strand === '-' && site.pamStart + 23 <= upper.length) {
      const guide = reverseComplement(upper.slice(site.pamStart + 3, site.pamStart + 23))
      guides.push({
        sequence: guide,
        pamSequence: site.pamSequence,
        strand: '-',
        localStart: site.pamStart + 3,
        localEnd: site.pamStart + 22,
        cutPosition: calculateSpCas9CutPosition(site.pamStart, '-'),
        gcContent: calculateGcContent(guide),
      })
    }
  }
  return deduplicateGuides(guides)
}

export function deduplicateGuides(guides: ExtractedGuide[]): ExtractedGuide[] {
  const seen = new Set<string>()
  return guides.filter((guide) => {
    const key = `${guide.sequence}:${guide.strand}:${guide.localStart}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
