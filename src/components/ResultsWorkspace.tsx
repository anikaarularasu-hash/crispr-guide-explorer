import { useMemo, useState } from 'react'
import { defaultWeights, rankGuides } from '../biology/scoring'
import { explainGuide } from '../biology/explanations'
import { recommendNuclease } from '../biology/nucleaseRecommendation'
import { downloadText, toCsv } from '../features/export'
import { genes, getGeneTranscripts, nucleases, organisms } from '../data/mockData'
import type { RankedGuide, RankingWeights, WarningSeverity } from '../types/crispr'
import type { DesignSetup } from './ExperimentWizard'
import { TargetVisualization } from './TargetVisualization'
import { NucleaseRecommendationCard } from './NucleaseRecommendationCard'
import { geneLocation } from '../biology/targeting'

type SortKey = 'overall' | 'activity' | 'specificity' | 'gc' | 'coverage' | 'distance' | 'warnings'

const severityRank: Record<WarningSeverity, number> = { information: 1, caution: 2, high: 3 }

function Score({ value, label, kind = 'heuristic' }: { value: number; label: string; kind?: string }) {
  return <span className="score-cell" title={`${label}: ${value}/100. ${kind}. A relative prototype score, not a percentage outcome.`}><b>{value}</b><i><span style={{ width: `${value}%` }} /></i></span>
}

function MetricHelp({ children }: { children: React.ReactNode }) {
  return <button className="metric-help" type="button" aria-label={`About ${children}`} title={`${children}: demonstration heuristic. Higher is favorable within this prototype, but does not guarantee an experimental outcome.`}>?</button>
}

export function ResultsWorkspace({ setup, initialGuides, onBack }: { setup: DesignSetup; initialGuides: RankedGuide[]; onBack: () => void }) {
  const [sort, setSort] = useState<SortKey>('overall')
  const [strand, setStrand] = useState<'all' | '+' | '-'>('all')
  const [coding, setCoding] = useState<'all' | 'coding' | 'noncoding'>('all')
  const [exon, setExon] = useState('all')
  const [minimumActivity, setMinimumActivity] = useState(0)
  const [minimumSpecificity, setMinimumSpecificity] = useState(0)
  const [warningType, setWarningType] = useState('all')
  const [maximumDistance, setMaximumDistance] = useState(999)
  const [selectedId, setSelectedId] = useState(initialGuides[0]?.id)
  const [comparison, setComparison] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [weights, setWeights] = useState<RankingWeights>({ ...defaultWeights[setup.experiment] })
  const gene = genes.find((item) => item.id === setup.geneId)!
  const transcript = getGeneTranscripts(setup.geneId).find((item) => item.id === setup.transcriptId)!
  const organism = organisms.find((item) => item.id === setup.organismId)!
  const nuclease = nucleases.find((item) => item.id === setup.nucleaseId)!

  const ranked = useMemo(() => rankGuides(initialGuides, setup.experiment, weights).map((guide) => ({ ...guide, explanation: explainGuide(guide, setup.experiment) })), [initialGuides, setup.experiment, weights])
  const visible = useMemo(() => ranked
    .filter((guide) => strand === 'all' || guide.strand === strand)
    .filter((guide) => coding === 'all' || (coding === 'coding' ? guide.codingStatus === 'coding' : guide.codingStatus !== 'coding'))
    .filter((guide) => exon === 'all' || guide.exonId === exon)
    .filter((guide) => guide.onTargetScore >= minimumActivity)
    .filter((guide) => guide.specificityScore >= minimumSpecificity)
    .filter((guide) => warningType === 'all' || guide.warnings.some((warning) => warning.type === warningType))
    .filter((guide) => setup.experiment !== 'knockin' || (guide.distanceFromEdit ?? 999) <= maximumDistance)
    .sort((a, b) => {
      const values: Record<SortKey, [number, number]> = {
        overall: [b.overallScore, a.overallScore], activity: [b.onTargetScore, a.onTargetScore],
        specificity: [b.specificityScore, a.specificityScore], gc: [b.gcContent, a.gcContent],
        coverage: [b.transcriptCoverage, a.transcriptCoverage], distance: [a.distanceFromEdit ?? 999, b.distanceFromEdit ?? 999],
        warnings: [Math.max(...b.warnings.map((w) => severityRank[w.severity])), Math.max(...a.warnings.map((w) => severityRank[w.severity]))],
      }
      return values[sort][0] - values[sort][1]
    }), [ranked, strand, coding, exon, minimumActivity, minimumSpecificity, warningType, maximumDistance, setup.experiment, sort])
  const selected = ranked.find((guide) => guide.id === selectedId) ?? ranked[0]
  const compared = comparison.map((id) => ranked.find((guide) => guide.id === id)).filter(Boolean) as RankedGuide[]
  const selectedRecommendation = selected ? recommendNuclease({
    context: setup.experimentContext,
    priority: setup.editingPriority,
    safetyContext: setup.safetyContext,
    specificityScore: selected.specificityScore,
    codingOffTargetCount: selected.offTargetCandidates.filter((item) => item.annotation === 'coding exon').length,
    guideDataQuality: 'demonstration',
    betterGuideAvailable: ranked.some((guide) =>
      guide.id !== selected.id
      && guide.specificityScore >= selected.specificityScore + 8
      && guide.offTargetCandidates.every((item) => item.annotation !== 'coding exon'),
    ),
  }) : null

  const toggleCompare = (id: string) => {
    setComparison((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 5 ? [...current, id] : current)
  }

  const exportRecords = ranked.slice(0, setup.desiredGuides).map((guide) => ({
    projectName: setup.projectName,
    date: new Date().toISOString(),
    experimentType: setup.experiment,
    organism: organism.scientificName,
    assembly: setup.assembly,
    gene: gene.symbol,
    transcript: transcript.id,
    targetLocation: geneLocation(gene),
    nuclease: nuclease.name,
    guide,
    mockData: true,
    softwareVersion: '0.2.0',
  }))

  return (
    <section className="results-workspace">
      <div className="workspace-heading results-title">
        <div><button className="back-link" onClick={onBack}>← Edit setup</button><span className="overline">{setup.experiment.toUpperCase()} DESIGN · DEMONSTRATION</span><h1>{gene.symbol} candidate guides</h1><p>{organism.scientificName} · {setup.assembly} · {transcript.id} · {nuclease.name}</p></div>
        <div className="result-actions"><button className="secondary-button" onClick={() => downloadText('guidewise-results.csv', toCsv(exportRecords), 'text/csv')}>Export CSV</button><button className="secondary-button" onClick={() => downloadText('guidewise-results.json', JSON.stringify(exportRecords, null, 2), 'application/json')}>JSON</button></div>
      </div>

      <div className="scientific-callout"><b>No universally best guide</b><span>Rank {ranked[0]?.rank} is the best fit for the current configurable heuristic—not a guarantee. Change experiment type or weights and the order may change.</span></div>
      <div className={`organism-mode-callout ${organism.genomeOrganization}`}>
        <b>{organism.genomeOrganization === 'prokaryotic' ? 'Bacterial analysis mode' : 'Eukaryotic analysis mode'}</b>
        <span>{organism.genomeOrganization === 'prokaryotic'
          ? 'Guide discovery and PAM search use the same organism-agnostic pipeline. Transcript coverage and exon ranking are not interpreted; review operon structure, polarity, and local regulation separately.'
          : `Transcript coverage and exon analysis are enabled${organism.supportsAlternativeSplicing ? ', including alternative-transcript context' : ''}.`}</span>
      </div>
      {selectedRecommendation && <NucleaseRecommendationCard recommendation={selectedRecommendation} selectedNucleaseId={setup.nucleaseId} />}
      <TargetVisualization guides={ranked} selectedId={selected?.id} experiment={setup.experiment} genomeOrganization={organism.genomeOrganization} />

      <details className="weights-panel">
        <summary>Advanced ranking weights <span>configurable heuristics, not universal scientific truth</span></summary>
        <div className="weight-grid">
          {Object.entries(weights).filter(([, value]) => value != null).map(([key, value]) => (
            <label key={key}><span>{key.replace(/([A-Z])/g, ' $1')} <b>{value}%</b></span><input type="range" min="0" max="60" value={value} onChange={(event) => setWeights({ ...weights, [key]: Number(event.target.value) })} /></label>
          ))}
        </div>
        <button className="text-button" onClick={() => setWeights({ ...defaultWeights[setup.experiment] })}>Reset suggested weights</button>
      </details>

      <div className="filter-bar" aria-label="Guide filters">
        <label>Sort by<select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="overall">Overall score</option><option value="activity">Activity</option><option value="specificity">Specificity</option><option value="gc">GC content</option>{organism.supportsTranscriptAnalysis && <option value="coverage">Transcript coverage</option>}<option value="distance">Cut-to-edit distance</option><option value="warnings">Warning severity</option></select></label>
        <label>Strand<select value={strand} onChange={(e) => setStrand(e.target.value as typeof strand)}><option value="all">Both strands</option><option value="+">+ strand</option><option value="-">− strand</option></select></label>
        <label>Region<select value={coding} onChange={(e) => setCoding(e.target.value as typeof coding)}><option value="all">All regions</option><option value="coding">Coding</option><option value="noncoding">Noncoding</option></select></label>
        {organism.supportsTranscriptAnalysis && <label>Exon<select value={exon} onChange={(e) => setExon(e.target.value)}><option value="all">All exons</option>{[...new Set(ranked.map((guide) => guide.exonId).filter((id): id is string => Boolean(id)))].map((id) => <option value={id} key={id}>{id}</option>)}</select></label>}
        <label>Min. activity<input type="number" min="0" max="100" value={minimumActivity} onChange={(e) => setMinimumActivity(Number(e.target.value))} /></label>
        <label>Min. specificity<input type="number" min="0" max="100" value={minimumSpecificity} onChange={(e) => setMinimumSpecificity(Number(e.target.value))} /></label>
        <label>Warning<select value={warningType} onChange={(e) => setWarningType(e.target.value)}><option value="all">Any warning</option><option value="low-gc">Low GC</option><option value="high-gc">High GC</option><option value="low-coverage">Low coverage</option><option value="coding-off-target">Coding off-target</option><option value="recutting-risk">Recutting risk</option></select></label>
        {setup.experiment === 'knockin' && <label>Max. edit distance<input type="number" min="0" value={maximumDistance} onChange={(e) => setMaximumDistance(Number(e.target.value))} /></label>}
        <button className="compare-button" disabled={comparison.length < 2} onClick={() => setShowComparison(true)}>Compare {comparison.length}/5</button>
      </div>

      <div className="table-wrap">
        <table className="guide-table">
          <caption className="sr-only">Ranked demonstration guide RNA candidates</caption>
          <thead><tr><th>Compare</th><th>Rank</th><th>Guide sequence / PAM</th><th>Location</th><th>Cut</th><th>GC</th><th>Activity <MetricHelp>activity</MetricHelp></th><th>Specificity <MetricHelp>specificity</MetricHelp></th><th>{organism.supportsTranscriptAnalysis ? <>Coverage <MetricHelp>transcript coverage</MetricHelp></> : 'Gene feature'}</th><th>Fit <MetricHelp>experiment fit</MetricHelp></th><th>Overall <MetricHelp>overall score</MetricHelp></th><th>Warnings</th></tr></thead>
          <tbody>
            {visible.map((guide) => (
              <tr key={guide.id} className={guide.id === selected?.id ? 'selected-row' : ''} onClick={() => setSelectedId(guide.id)}>
                <td onClick={(e) => e.stopPropagation()}><input aria-label={`Compare guide ${guide.rank}`} type="checkbox" checked={comparison.includes(guide.id)} onChange={() => toggleCompare(guide.id)} /></td>
                <td><span className="rank-badge">{guide.rank}</span></td>
                <td><code>{guide.sequence}</code><small><b>{guide.pamSequence}</b> · {guide.strand} strand</small></td>
                <td><b>{guide.exonId ?? guide.codingStatus}</b><small>{guide.chromosome}:{guide.genomicStart.toLocaleString()}–{guide.genomicEnd.toLocaleString()}</small></td>
                <td>{guide.cutPosition.toLocaleString()}<small>{setup.experiment === 'knockin' ? `${guide.distanceFromEdit} bp to edit` : '≈3 bp upstream PAM'}</small></td>
                <td>{guide.gcContent.toFixed(0)}%</td>
                <td><Score value={guide.onTargetScore} label="Activity" /></td>
                <td><Score value={guide.specificityScore} label="Specificity" /></td>
                <td>{organism.supportsTranscriptAnalysis ? <>{guide.transcriptCoverage.toFixed(0)}%<small>{guide.transcriptIds.length}/{getGeneTranscripts(gene.id).length} selected</small></> : <>CDS<small>transcript coverage not applied</small></>}</td>
                <td><Score value={guide.experimentLocationScore} label="Experiment fit" /></td>
                <td><strong className="overall-score">{guide.overallScore}</strong></td>
                <td><span className={`warning-count ${guide.warnings.some((w) => w.severity === 'high') ? 'has-high' : ''}`}>{guide.warnings.filter((w) => w.changesRanking).length} <span>review</span></span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <div className="empty-state"><b>No guides match these filters.</b><span>Lower a threshold or include both strands and region types.</span></div>}
      </div>

      {selected && <GuideDetail guide={selected} geneSymbol={gene.symbol} transcriptId={transcript.id} supportsTranscriptAnalysis={organism.supportsTranscriptAnalysis} />}
      {showComparison && <Comparison guides={compared} onClose={() => setShowComparison(false)} />}
    </section>
  )
}

function GuideDetail({ guide, geneSymbol, transcriptId, supportsTranscriptAnalysis }: { guide: RankedGuide; geneSymbol: string; transcriptId: string; supportsTranscriptAnalysis: boolean }) {
  return (
    <aside className="detail-panel" aria-labelledby="detail-heading">
      <div className="detail-header"><div><span className="overline">SELECTED GUIDE · RANK {guide.rank}</span><h2 id="detail-heading"><code>{guide.sequence}</code><mark>{guide.pamSequence}</mark></h2></div><strong className="detail-score">{guide.overallScore}<small>heuristic fit</small></strong></div>
      <div className="detail-grid">
        <section><h3>Target & cleavage</h3><dl><div><dt>{supportsTranscriptAnalysis ? 'Gene / transcript' : 'Gene / feature'}</dt><dd>{geneSymbol} · {transcriptId}</dd></div><div><dt>Genomic orientation</dt><dd>{guide.strand} strand <span title="Strand indicates genomic orientation. It does not by itself determine whether a guide is better.">ⓘ</span></dd></div><div><dt>Coordinates</dt><dd>{guide.chromosome}:{guide.genomicStart}–{guide.genomicEnd}</dd></div><div><dt>Expected cut</dt><dd>{guide.cutPosition} (approximate)</dd></div><div><dt>Target region</dt><dd>{guide.exonId ?? guide.codingStatus}</dd></div><div><dt>Protein region</dt><dd>{guide.proteinPosition ? `${guide.proteinPosition}% through protein` : 'Not applicable'}</dd></div></dl></section>
        <section><h3>Transparent metrics</h3><dl><div><dt>GC content</dt><dd>{guide.gcContent.toFixed(1)}% = {(guide.sequence.match(/[GC]/g) ?? []).length}/20 G or C bases</dd></div><div><dt>Activity</dt><dd>{guide.onTargetScore}/100 · demonstration heuristic</dd></div><div><dt>Specificity</dt><dd>{guide.specificityScore}/100 · no genome-wide search</dd></div>{supportsTranscriptAnalysis ? <div><dt>Transcript coverage</dt><dd>{guide.transcriptCoverage}% · {guide.transcriptIds.join(', ')}</dd></div> : <div><dt>Gene feature model</dt><dd>Single CDS · exon coverage not applied</dd></div>}<div><dt>Distance from TSS</dt><dd>{guide.distanceFromTss} bp</dd></div><div><dt>Distance from edit</dt><dd>{guide.distanceFromEdit ?? 'Not applicable'} bp</dd></div></dl></section>
      </div>
      <section className="recommendation"><h3>Why this guide ranks here</h3><p>{guide.explanation}</p></section>
      <section className="warnings-section"><h3>Warnings and evidence</h3><div className="warning-list">{guide.warnings.map((warning) => <article className={`warning warning-${warning.severity}`} key={warning.type}><span>{warning.severity === 'high' ? '!' : warning.severity === 'caution' ? '△' : 'i'}</span><div><strong>{warning.title}</strong><p>{warning.explanation}</p><small>Evidence: {warning.evidence}. {warning.interpretation}</small></div></article>)}</div></section>
      <section className="offtarget-section">
        <h3>Off-target candidates</h3>
        {guide.offTargetCandidates.length ? (
          <div className="table-wrap"><table className="offtarget-table"><thead><tr><th>Location</th><th>Sequence / PAM</th><th>Mismatches</th><th>Annotation</th><th>Risk</th></tr></thead><tbody>{guide.offTargetCandidates.map((item) => <tr key={`${item.chromosome}-${item.position}`}><td>{item.chromosome}:{item.position}</td><td><code>{item.sequence}</code> · {item.pam}</td><td>{item.mismatches} at {item.mismatchPositions.join(', ')}</td><td>{item.annotation}{item.gene ? ` · ${item.gene}` : ''}</td><td>{item.riskScore}/100 · simulated</td></tr>)}</tbody></table></div>
        ) : <p className="no-offtargets"><b>No simulated records for this guide.</b> This does not mean no genomic off-targets exist; a real genome-wide search has not been run.</p>}
      </section>
      <section className="model-card"><div><span className="overline">MODEL CARD</span><h3>{guide.scoringModelMetadata.name} · v{guide.scoringModelMetadata.version}</h3></div><dl><div><dt>Evidence level</dt><dd>{guide.scoringModelMetadata.evidenceLevel}</dd></div><div><dt>Scale</dt><dd>{guide.scoringModelMetadata.outputRange}</dd></div><div><dt>Applicable context</dt><dd>{guide.scoringModelMetadata.applicableNuclease}</dd></div><div><dt>Limitations</dt><dd>{guide.scoringModelMetadata.limitations}</dd></div></dl></section>
      <details className="meaning-section"><summary>What does the cut position mean?</summary><p>The PAM helps SpCas9 recognize a valid target, while the guide pairs with target DNA. SpCas9’s HNH and RuvC domains cut opposite strands near the PAM-proximal guide end. Cleavage is generally represented about three bases upstream of the PAM, but exact products can vary.</p></details>
      <details className="meaning-section"><summary>What does specificity mean?</summary><p>Specificity asks how selectively a guide may act at its intended site. This prototype does not search a genome. A real assessment must inspect individual near-matches, compatible PAMs, mismatch positions, bulges, and genomic consequences.</p></details>
    </aside>
  )
}

function Comparison({ guides, onClose }: { guides: RankedGuide[]; onClose: () => void }) {
  const best = (key: keyof RankedGuide, low = false) => guides.reduce((winner, guide) => low ? Number(guide[key]) < Number(winner[key]) ? guide : winner : Number(guide[key]) > Number(winner[key]) ? guide : winner, guides[0])
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="comparison-modal" role="dialog" aria-modal="true" aria-labelledby="comparison-title">
        <div className="comparison-heading"><div><span className="overline">SIDE-BY-SIDE</span><h2 id="comparison-title">Compare guides by strength</h2><p>No guide is labeled universally best.</p></div><button onClick={onClose} aria-label="Close comparison">×</button></div>
        <div className="comparison-grid" style={{ gridTemplateColumns: `170px repeat(${guides.length}, minmax(190px, 1fr))` }}>
          <b>Metric</b>{guides.map((g) => <strong key={g.id}>Guide {g.rank}<code>{g.sequence}</code></strong>)}
          <span>Best suited for</span>{guides.map((g) => <span className="highlight-labels" key={g.id}>{g === best('onTargetScore') && <mark>Best activity</mark>}{g === best('specificityScore') && <mark>Best specificity</mark>}{g === best('transcriptCoverage') && <mark>Best coverage</mark>}{g === best('distanceFromEdit', true) && <mark>Closest cut</mark>}</span>)}
          {[
            ['PAM / strand', (g: RankedGuide) => `${g.pamSequence} / ${g.strand}`],
            ['Genomic location', (g: RankedGuide) => `${g.chromosome}:${g.genomicStart}`],
            ['GC content', (g: RankedGuide) => `${g.gcContent.toFixed(1)}%`],
            ['Activity', (g: RankedGuide) => `${g.onTargetScore}/100`],
            ['Specificity', (g: RankedGuide) => `${g.specificityScore}/100`],
            ['Transcript coverage', (g: RankedGuide) => `${g.transcriptCoverage}%`],
            ['Experiment fit', (g: RankedGuide) => `${g.experimentLocationScore}/100`],
            ['Warnings', (g: RankedGuide) => `${g.warnings.filter((w) => w.changesRanking).length}`],
          ].flatMap(([label, format]) => [<b key={`${label}-label`}>{label as string}</b>, ...guides.map((g) => <span key={`${label}-${g.id}`}>{(format as (guide: RankedGuide) => string)(g)}</span>)])}
        </div>
      </section>
    </div>
  )
}
