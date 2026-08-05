import type { BiologicalTarget, Gene, GenomicLocation } from '../types/crispr'

export function geneLocation(gene: Gene): GenomicLocation {
  return {
    assemblyId: gene.assembly,
    chromosomeLabel: gene.chromosome,
    sequenceAccession: gene.sequenceAccession,
    start: gene.genomicStart,
    end: gene.genomicEnd,
    strand: gene.strand,
  }
}

export function validateBiologicalTarget(target: BiologicalTarget): string[] {
  const errors: string[] = []
  if (!target.organismId) errors.push('Select an organism.')
  if (!target.assemblyId && target.inputMode !== 'raw_sequence' && target.inputMode !== 'custom_genome') errors.push('Select a genome assembly.')

  if (target.inputMode === 'gene' && !target.geneId) errors.push('Choose a recognized gene record.')
  if (target.inputMode === 'transcript' && !target.transcriptId) errors.push('Choose a recognized transcript ID.')
  if (target.inputMode === 'genomic_region') {
    if (!target.location?.chromosomeLabel.trim()) errors.push('Enter a chromosome or sequence identifier.')
    if (!Number.isFinite(target.location?.start) || (target.location?.start ?? 0) < 1) errors.push('Enter a valid start coordinate.')
    if (!Number.isFinite(target.location?.end) || (target.location?.end ?? 0) < 1) errors.push('Enter a valid end coordinate.')
    if (target.location && target.location.end < target.location.start) errors.push('End coordinate must be greater than or equal to the start coordinate.')
  }
  if (target.inputMode === 'raw_sequence' && !/^[ACGT]+$/i.test(target.rawSequence?.replace(/\s/g, '') ?? '')) errors.push('Enter a DNA sequence containing only A, C, G, and T.')
  return errors
}
