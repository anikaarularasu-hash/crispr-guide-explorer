export interface GuideCandidate {
  guide: string
  pam: string
  /** Zero-based index of the first PAM nucleotide in the normalized sequence. */
  pamPosition: number
  gcPercentage: number
}

export function normalizeSequence(input: string): string {
  // Line numbers are common in FASTA-like copy/paste output; all digits and whitespace are ignored.
  const normalized = input.toUpperCase().replace(/[\s\d]/g, '')

  if (/[^ATCG]/.test(normalized)) {
    const invalid = [...new Set(normalized.match(/[^ATCG]/g) ?? [])].join(', ')
    throw new Error(`Invalid character${invalid.length > 1 ? 's' : ''}: ${invalid}. Use only A, T, C, and G.`)
  }

  return normalized
}

export function calculateGcPercentage(sequence: string): number {
  if (sequence.length === 0) return 0
  const gcCount = (sequence.match(/[GC]/gi) ?? []).length
  return (gcCount / sequence.length) * 100
}

export function findForwardGuides(sequence: string): GuideCandidate[] {
  const guides: GuideCandidate[] = []

  for (let pamPosition = 20; pamPosition <= sequence.length - 3; pamPosition += 1) {
    const pam = sequence.slice(pamPosition, pamPosition + 3)
    if (/^[ATCG]GG$/.test(pam)) {
      const guide = sequence.slice(pamPosition - 20, pamPosition)
      guides.push({
        guide,
        pam,
        pamPosition,
        gcPercentage: calculateGcPercentage(guide),
      })
    }
  }

  return guides
}
