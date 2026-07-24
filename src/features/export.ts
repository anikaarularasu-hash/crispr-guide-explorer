import type { ExportRecord } from '../types/crispr'

const fields = [
  'projectName', 'date', 'experimentType', 'organism', 'assembly', 'gene', 'transcript', 'nuclease',
  'guideSequence', 'pam', 'strand', 'coordinates', 'cutPosition', 'gcContent', 'exon',
  'transcriptCoverage', 'activityScore', 'activityModel', 'specificityScore', 'offTargetCount',
  'highRiskOffTargets', 'experimentLocationScore', 'overallScore', 'warnings', 'explanation',
  'mockDataStatus', 'softwareVersion',
] as const

function escapeCsv(value: unknown): string {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function recordToRow(record: ExportRecord): Record<(typeof fields)[number], string | number> {
  const guide = record.guide
  return {
    projectName: record.projectName,
    date: record.date,
    experimentType: record.experimentType,
    organism: record.organism,
    assembly: record.assembly,
    gene: record.gene,
    transcript: record.transcript,
    nuclease: record.nuclease,
    guideSequence: guide.sequence,
    pam: guide.pamSequence,
    strand: guide.strand,
    coordinates: `${guide.chromosome}:${guide.genomicStart}-${guide.genomicEnd}`,
    cutPosition: guide.cutPosition,
    gcContent: guide.gcContent.toFixed(1),
    exon: guide.exonId ?? guide.codingStatus,
    transcriptCoverage: `${guide.transcriptCoverage.toFixed(0)}%`,
    activityScore: guide.onTargetScore,
    activityModel: `${guide.scoringModelMetadata.name} ${guide.scoringModelMetadata.version}`,
    specificityScore: guide.specificityScore,
    offTargetCount: guide.offTargetCandidates.length,
    highRiskOffTargets: guide.offTargetCandidates.filter((item) => item.riskScore >= 60).length,
    experimentLocationScore: guide.experimentLocationScore,
    overallScore: guide.overallScore,
    warnings: guide.warnings.map((item) => item.title).join('; '),
    explanation: guide.explanation,
    mockDataStatus: record.mockData ? 'Demonstration data active' : 'Real provider',
    softwareVersion: record.softwareVersion,
  }
}

export function toCsv(records: ExportRecord[]): string {
  const rows = records.map(recordToRow)
  return [fields.join(','), ...rows.map((row) => fields.map((field) => escapeCsv(row[field])).join(','))].join('\n')
}

export function downloadText(filename: string, text: string, type: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text], { type }))
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
