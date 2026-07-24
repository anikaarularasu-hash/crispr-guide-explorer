import type { CandidateGuide, ExperimentType, GuideWarning } from '../types/crispr'

function warning(
  type: string,
  severity: GuideWarning['severity'],
  title: string,
  explanation: string,
  evidence: string,
  changesRanking = true,
): GuideWarning {
  return {
    type,
    severity,
    title,
    explanation,
    evidence,
    interpretation: 'Review this signal alongside location, specificity, activity, and experimental context.',
    changesRanking,
  }
}

export function generateWarnings(
  guide: Pick<CandidateGuide, 'gcContent' | 'sequence' | 'codingStatus' | 'transcriptCoverage' | 'proteinPosition' | 'distanceFromEdit' | 'distanceFromTss' | 'offTargetCandidates'>,
  experiment: ExperimentType,
  options: { tssWindow?: [number, number]; maximumCutDistance?: number; nucleaseId?: string } = {},
): GuideWarning[] {
  const warnings: GuideWarning[] = []
  if (guide.gcContent < 25) warnings.push(warning('extreme-gc', 'high', 'Extreme low GC content', 'Very low GC may reduce stable target pairing.', `${guide.gcContent.toFixed(1)}% GC`))
  else if (guide.gcContent < 40) warnings.push(warning('low-gc', 'caution', 'GC content below common initial range', 'Low GC can reduce stable binding, but it does not automatically disqualify a guide.', `${guide.gcContent.toFixed(1)}% GC`))
  if (guide.gcContent > 75) warnings.push(warning('extreme-gc', 'high', 'Extreme high GC content', 'Very high GC can increase secondary-structure and strong-binding concerns.', `${guide.gcContent.toFixed(1)}% GC`))
  else if (guide.gcContent > 60) warnings.push(warning('high-gc', 'caution', 'GC content above common initial range', 'High GC can increase secondary-structure concerns, but it is only one feature.', `${guide.gcContent.toFixed(1)}% GC`))
  if (/(A{4,}|C{4,}|G{4,}|T{4,})/.test(guide.sequence)) warnings.push(warning('homopolymer', 'caution', 'Long homopolymer sequence', 'Repeated bases can complicate synthesis or guide expression.', 'Four or more identical consecutive bases'))
  if (guide.codingStatus === 'intron') warnings.push(warning('intronic', 'caution', 'Guide targets an intron', 'Small intronic indels are often removed during splicing unless a splice or regulatory element is affected.', 'Demonstration region annotation'))
  if (experiment === 'knockout' && guide.codingStatus !== 'coding') warnings.push(warning('noncoding', 'high', 'Noncoding target for protein knockout', 'This location is less directly connected to disrupting a protein-coding sequence.', guide.codingStatus))
  if (guide.transcriptCoverage < 60) warnings.push(warning('low-coverage', 'caution', 'Low transcript coverage', 'This guide may affect only a subset of relevant isoforms.', `${guide.transcriptCoverage.toFixed(0)}% of selected transcripts`))
  if (experiment === 'knockout' && (guide.proteinPosition ?? 50) > 80) warnings.push(warning('late-exon', 'caution', 'Target is late in the coding sequence', 'A late edit may leave much of the protein intact and may escape nonsense-mediated decay.', `${guide.proteinPosition?.toFixed(0)}% through protein`))
  if (experiment === 'knockin' && (guide.distanceFromEdit ?? 0) > (options.maximumCutDistance ?? 20)) warnings.push(warning('far-from-edit', 'high', 'Cut is far from intended edit', 'HDR outcomes often depend strongly on cut-to-edit distance.', `${guide.distanceFromEdit} bp`))
  if (experiment === 'knockin') warnings.push(warning('recutting-risk', 'caution', 'Recutting protection must be confirmed', 'The repaired allele may be recut if the PAM or guide-recognition sequence remains compatible.', 'Donor sequence is not modeled in this prototype'))
  if ((experiment === 'crispra' || experiment === 'crispri') && options.tssWindow) {
    const [start, end] = options.tssWindow
    if (guide.distanceFromTss < start || guide.distanceFromTss > end) warnings.push(warning('outside-tss-window', 'caution', `Outside configured ${experiment === 'crispra' ? 'CRISPRa' : 'CRISPRi'} window`, 'Location suitability depends on the selected effector and biological context.', `${guide.distanceFromTss} bp from TSS; configured ${start} to ${end}`))
  }
  if (guide.offTargetCandidates.some((item) => item.annotation === 'coding exon' && item.mismatches <= 2)) warnings.push(warning('coding-off-target', 'high', 'Simulated coding off-target', 'A close match in a coding exon warrants individual review.', 'Demonstration off-target record; not a genome-wide search'))
  if (options.nucleaseId && options.nucleaseId !== 'spcas9') warnings.push(warning('model-nuclease', 'high', 'Heuristic not validated for selected nuclease variant', 'This prototype applies an SpCas9-oriented sequence heuristic and cannot compare variant-specific behavior.', `Selected nuclease: ${options.nucleaseId}`))
  warnings.push(warning('mock-data', 'information', 'Demonstration data', 'Sequence context, annotations, activity, specificity, and off-target records may be simulated.', 'Mock provider active', false))
  warnings.push(warning('heuristic-score', 'information', 'Demonstration scoring', 'Scores are deterministic heuristics, not validated biological predictions or editing percentages.', 'GuideWise heuristic v0.2', false))
  return warnings
}
