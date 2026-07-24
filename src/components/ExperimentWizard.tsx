import { useEffect, useState } from 'react'
import { genes, getGeneTranscripts, nucleases, organisms } from '../data/mockData'
import type { ExperimentType } from '../types/crispr'

export interface DesignSetup {
  projectName: string
  experiment: ExperimentType
  organismId: string
  assembly: string
  geneId: string
  transcriptId: string
  nucleaseId: string
  desiredGuides: number
  editPosition: number
  referenceAllele: string
  desiredAllele: string
  windowStart: number
  windowEnd: number
  multipleGuides: boolean
}

const experimentInfo: Record<ExperimentType, { title: string; description: string }> = {
  knockout: { title: 'Gene knockout', description: 'Prioritize coding disruption and relevant transcript coverage.' },
  knockin: { title: 'Precise knock-in', description: 'Prioritize cut-to-edit distance, specificity, and donor compatibility.' },
  crispra: { title: 'CRISPR activation', description: 'Prioritize position relative to a selected transcription start site.' },
  crispri: { title: 'CRISPR interference', description: 'Prioritize transcriptional repression near a selected start site.' },
}

export function ExperimentWizard({ initialExperiment, onCancel, onComplete }: { initialExperiment: ExperimentType; onCancel: () => void; onComplete: (setup: DesignSetup) => void }) {
  const [step, setStep] = useState(1)
  const [experiment, setExperiment] = useState(initialExperiment)
  const [organismId, setOrganismId] = useState('human')
  const [geneId, setGeneId] = useState('hbb')
  const [transcriptId, setTranscriptId] = useState('')
  const [nucleaseId, setNucleaseId] = useState('spcas9')
  const [desiredGuides, setDesiredGuides] = useState(8)
  const [editPosition, setEditPosition] = useState(5_225_520)
  const [referenceAllele, setReferenceAllele] = useState('A')
  const [desiredAllele, setDesiredAllele] = useState('G')
  const [windowStart, setWindowStart] = useState(-400)
  const [windowEnd, setWindowEnd] = useState(-50)
  const [multipleGuides, setMultipleGuides] = useState(true)
  const gene = genes.find((item) => item.id === geneId)!
  const availableTranscripts = getGeneTranscripts(geneId)
  const organism = organisms.find((item) => item.id === organismId)!

  useEffect(() => {
    setTranscriptId('')
    setEditPosition(gene.genomicStart + 56)
  }, [geneId, gene.genomicStart])

  const next = () => {
    if (step === 2 && !transcriptId) return
    if (step < 3) setStep(step + 1)
    else onComplete({
      projectName: `${gene.symbol} ${experiment} design`,
      experiment, organismId, assembly: organism.assemblies[0].id, geneId, transcriptId,
      nucleaseId, desiredGuides, editPosition, referenceAllele, desiredAllele,
      windowStart, windowEnd, multipleGuides,
    })
  }

  return (
    <section className="wizard">
      <div className="workspace-heading">
        <div><button className="back-link" onClick={onCancel}>← Home</button><span className="overline">NEW GUIDE DESIGN</span><h1>Configure your experiment</h1><p>Three deliberate steps. No silent transcript or nuclease assumptions.</p></div>
        <div className="step-counter">Step <b>{step}</b> of 3</div>
      </div>
      <ol className="wizard-progress" aria-label="Setup progress">
        {['Experiment goal', 'Target & transcript', 'Experiment details'].map((label, index) => (
          <li className={step === index + 1 ? 'current' : step > index + 1 ? 'done' : ''} key={label}>
            <span>{step > index + 1 ? '✓' : index + 1}</span><b>{label}</b>
          </li>
        ))}
      </ol>

      <div className="wizard-card">
        {step === 1 && (
          <fieldset>
            <legend>What is the goal of this experiment?</legend>
            <p className="field-help">This choice changes preferred target locations, questions, scores, warnings, and ranking—not just the page label.</p>
            <div className="choice-grid">
              {(Object.keys(experimentInfo) as ExperimentType[]).map((id) => (
                <label className={`choice-card ${experiment === id ? 'selected' : ''}`} key={id}>
                  <input type="radio" name="experiment" value={id} checked={experiment === id} onChange={() => setExperiment(id)} />
                  <strong>{experimentInfo[id].title}</strong><span>{experimentInfo[id].description}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend>Select the biological target</legend>
            <div className="data-notice"><b>Demonstration genomic data</b><span>Coordinates, sequences, annotations, and transcript structures on this screen are simulated.</span></div>
            <div className="form-grid">
              <label>Organism<select value={organismId} onChange={(event) => setOrganismId(event.target.value)}>{organisms.map((item) => <option value={item.id} key={item.id}>{item.scientificName} ({item.commonName})</option>)}</select></label>
              <label>Genome assembly<select value={organism.assemblies[0].id} disabled><option>{organism.assemblies[0].label}</option></select></label>
              <label>Gene<select value={geneId} onChange={(event) => setGeneId(event.target.value)}>{genes.map((item) => <option value={item.id} key={item.id}>{item.symbol} — {item.name}</option>)}</select></label>
              <label>Cas nuclease<select value={nucleaseId} onChange={(event) => setNucleaseId(event.target.value)}>{nucleases.map((item) => <option value={item.id} key={item.id} disabled={item.id === 'sacas9'}>{item.name}{item.id === 'sacas9' ? ' — future support' : ''}</option>)}</select></label>
              <label className="full-field">Transcript <span className="required">required</span>
                <select aria-invalid={!transcriptId} value={transcriptId} onChange={(event) => setTranscriptId(event.target.value)}>
                  <option value="">Choose a transcript explicitly…</option>
                  {availableTranscripts.map((item) => <option value={item.id} key={item.id}>{item.id} {item.canonical ? '· canonical' : '· alternative'}</option>)}
                </select>
              </label>
            </div>
            {transcriptId ? (
              <div className="transcript-summary">
                {(() => { const item = availableTranscripts.find((tx) => tx.id === transcriptId)!; return <><span><small>STATUS</small>{item.proteinCoding ? 'Protein coding' : 'Noncoding'}</span><span><small>EXONS</small>{item.exonCount}</span><span><small>CODING LENGTH</small>{item.codingSequenceLength} bp</span><span><small>CANONICAL</small>{item.canonical ? 'Yes (demo)' : 'No'}</span></> })()}
              </div>
            ) : <p className="validation-message">Select a transcript to continue. GuideWise will not silently choose one.</p>}
            <details className="nuclease-note"><summary>Cas9 versus SpCas9</summary><p><b>Cas9</b> is a category; <b>SpCas9</b> is one specific member, originally identified in <i>Streptococcus pyogenes</i>. SpCas9 generally creates a double-strand break approximately three base pairs upstream of the PAM, although exact cleavage products can vary.</p></details>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend>{experimentInfo[experiment].title} details</legend>
            {experiment === 'knockout' && (
              <div className="form-grid">
                <label>Desired number of guides<input type="number" min="1" max="20" value={desiredGuides} onChange={(e) => setDesiredGuides(Number(e.target.value))} /></label>
                <label>Minimum transcript coverage<select defaultValue="80"><option value="100">100%</option><option value="80">80%</option><option value="50">50%</option></select></label>
                {['Prioritize exons shared across transcripts', 'Avoid first coding exon', 'Avoid final coding exon', 'Prefer known functional protein domains'].map((label, index) => <label className="check-field" key={label}><input type="checkbox" defaultChecked={index !== 1} /> {label}</label>)}
                <label className="check-field full-field"><input type="checkbox" checked={multipleGuides} onChange={(e) => setMultipleGuides(e.target.checked)} /> Recommend multiple guides for independent validation</label>
              </div>
            )}
            {experiment === 'knockin' && (
              <div className="form-grid">
                <label>Exact intended edit position<input type="number" value={editPosition} onChange={(e) => setEditPosition(Number(e.target.value))} /></label>
                <label>Edit type<select><option>Substitution</option><option>Insertion</option><option>Deletion</option></select></label>
                <label>Reference allele<input value={referenceAllele} onChange={(e) => setReferenceAllele(e.target.value.toUpperCase())} /></label>
                <label>Desired allele<input value={desiredAllele} onChange={(e) => setDesiredAllele(e.target.value.toUpperCase())} /></label>
                <label>Donor-template type<select><option>ssODN</option><option>Double-stranded DNA</option><option>Plasmid</option></select></label>
                <label>Maximum cut-to-edit distance<input type="number" defaultValue="20" /></label>
                {['Silent donor changes allowed', 'Donor can disrupt the PAM', 'Donor can disrupt the guide-binding sequence', 'Protect corrected allele from recutting'].map((label) => <label className="check-field" key={label}><input type="checkbox" defaultChecked /> {label}</label>)}
              </div>
            )}
            {(experiment === 'crispra' || experiment === 'crispri') && (
              <div className="form-grid">
                <label>Selected transcription start site<input type="number" value={gene.transcriptionStartSite} readOnly /></label>
                <label>Effector / system<select><option>{experiment === 'crispra' ? 'dCas9-VPR' : 'dCas9-KRAB'}</option><option>dCas9-SunTag</option></select></label>
                <label>Window start (bp from TSS)<input type="number" value={windowStart} onChange={(e) => setWindowStart(Number(e.target.value))} /></label>
                <label>Window end (bp from TSS)<input type="number" value={windowEnd} onChange={(e) => setWindowEnd(Number(e.target.value))} /></label>
                <label>Desired number of guides<input type="number" min="1" max="20" value={desiredGuides} onChange={(e) => setDesiredGuides(Number(e.target.value))} /></label>
                <label>Cell type <span className="optional">optional; no real data</span><input placeholder="e.g., HEK293T" /></label>
                <label className="check-field full-field"><input type="checkbox" checked={multipleGuides} onChange={(e) => setMultipleGuides(e.target.checked)} /> Recommend multiple guides</label>
                <p className="full-field field-help">The targeting window is configurable because effective windows vary by effector, promoter architecture, cell type, and biological context.</p>
              </div>
            )}
          </fieldset>
        )}

        <div className="wizard-actions">
          <button className="secondary-button" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>{step === 1 ? 'Cancel' : '← Back'}</button>
          <button className="primary-button" disabled={step === 2 && !transcriptId} onClick={next}>{step === 3 ? 'Generate demonstration guides' : 'Continue →'}</button>
        </div>
      </div>
    </section>
  )
}
