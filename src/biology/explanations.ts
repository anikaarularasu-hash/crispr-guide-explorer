import type { ExperimentType, RankedGuide } from '../types/crispr'

export function explainGuide(guide: RankedGuide, experiment: ExperimentType): string {
  const strength =
    guide.specificityScore >= guide.onTargetScore
      ? `Its strongest heuristic is specificity (${guide.specificityScore}/100)`
      : `Its strongest heuristic is predicted activity (${guide.onTargetScore}/100)`
  const weakness = guide.warnings.find((item) => item.severity === 'high' || item.severity === 'caution')
  const context =
    experiment === 'knockout'
      ? `It targets a ${guide.codingStatus} region with ${guide.transcriptCoverage.toFixed(0)}% transcript coverage.`
      : experiment === 'knockin'
        ? `Its simulated cut is ${guide.distanceFromEdit ?? 'an unknown number of'} bp from the intended edit.`
        : `It lies ${guide.distanceFromTss} bp from the selected transcription start site.`
  const weaknessText = weakness
    ? `Its largest current concern is “${weakness.title.toLowerCase()}.”`
    : 'No ranking-changing warning dominates, although unmodeled biological factors remain.'
  return `${strength}. ${context} ${weaknessText} This ranking is a configurable demonstration heuristic, not a guarantee of editing or biological effect; another guide may be preferable for a different experiment.`
}
