export function normalizeDna(input: string): string {
  const withoutHeaders = input
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('>'))
    .join('')
  const normalized = withoutHeaders.toUpperCase().replace(/[\s\d]/g, '')
  const invalid = [...new Set(normalized.match(/[^ACGT]/g) ?? [])]
  if (invalid.length) {
    throw new Error(`Invalid DNA character${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}. Use only A, C, G, and T.`)
  }
  return normalized
}

export function isValidDna(sequence: string): boolean {
  return sequence.length > 0 && /^[ACGT]+$/i.test(sequence)
}

export function reverseComplement(sequence: string): string {
  if (!isValidDna(sequence)) throw new Error('Reverse complement requires a non-empty A, C, G, T sequence.')
  const complement: Record<string, string> = { A: 'T', C: 'G', G: 'C', T: 'A' }
  return [...sequence.toUpperCase()].reverse().map((base) => complement[base]).join('')
}

export function calculateGcContent(sequence: string): number {
  if (!sequence.length) return 0
  if (!/^[ACGT]+$/i.test(sequence)) throw new Error('GC content requires A, C, G, and T only.')
  return ((sequence.match(/[GC]/gi) ?? []).length / sequence.length) * 100
}

export function localToGenomic(localIndex: number, genomicRegionStart: number): number {
  if (localIndex < 0) throw new Error('Local coordinate cannot be negative.')
  return genomicRegionStart + localIndex
}

export function genomicToLocal(genomicPosition: number, genomicRegionStart: number): number {
  const local = genomicPosition - genomicRegionStart
  if (local < 0) throw new Error('Genomic position falls before this sequence region.')
  return local
}
