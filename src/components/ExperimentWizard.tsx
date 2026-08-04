import { useEffect, useMemo, useState } from 'react'
import {
  getGenesForAssembly,
  getGeneTranscripts,
  organismCategoryLabels,
  organismCategoryOrder,
  organisms,
} from '../data/mockData'
import { recommendNuclease } from '../biology/nucleaseRecommendation'
import type { EditingPriority, ExperimentContext, ExperimentType, NucleaseId, SafetyContext } from '../types/crispr'
import { NucleaseRecommendationCard } from './NucleaseRecommendationCard'

export interface DesignSetup {
  projectName: string
  experiment: ExperimentType
  organismId: string
  assembly: string
  geneId: string
  transcriptId: string
  nucleaseId: NucleaseId
  experimentContext: ExperimentContext
  editingPriority: EditingPriority
  safetyContext: SafetyContext
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
  const [assemblyId, setAssemblyId] = useState('GRCh38')
  const [geneId, setGeneId] = useState('hbb')
  const [transcriptId, setTranscriptId] = useState('')
  const [nucleaseId, setNucleaseId] = useState<NucleaseId>('spcas9')
  const [experimentContext, setExperimentContext] = useState<ExperimentContext>('cultured_cell_knockout')
  const [editingPriority, setEditingPriority] = useState<EditingPriority>('balanced')
  const [safetyContext, setSafetyContext] = useState<SafetyContext>('research_only')
  const [desiredGuides, setDesiredGuides] = useState(8)
  const [editPosition, setEditPosition] = useState(5_225_520)
  const [referenceAllele, setReferenceAllele] = useState('A')
  const [desiredAllele, setDesiredAllele] = useState('G')
  const [windowStart, setWindowStart] = useState(-400)
  const [windowEnd, setWindowEnd] = useState(-50)
  const [multipleGuides, setMultipleGuides] = useState(true)
  const organism = organisms.find((item) => item.id === organismId)!
  const availableGenes = getGenesForAssembly(organismId, assemblyId)
  const gene = availableGenes.find((item) => item.id === geneId) ?? availableGenes[0]
  const availableTranscripts = gene ? getGeneTranscripts(gene.id) : []
  const nucleaseRecommendation = useMemo(() => recommendNuclease({
    context: experimentContext,
    priority: editingPriority,
    safetyContext,
    guideDataQuality: 'none',
  }), [experimentContext, editingPriority, safetyContext])

  useEffect(() => {
    setTranscriptId('')
    if (gene) setEditPosition(gene.genomicStart + 56)
  }, [geneId, gene])

  const changeOrganism = (nextOrganismId: string) => {
    const nextOrganism = organisms.find((item) => item.id === nextOrganismId)!
    const nextAssembly = nextOrganism.assemblies[0].id
    const nextGene = getGenesForAssembly(nextOrganismId, nextAssembly)[0]
    setOrganismId(nextOrganismId)
    setAssemblyId(nextAssembly)
    setGeneId(nextGene?.id ?? '')
    setTranscriptId('')
  }

  const changeAssembly = (nextAssemblyId: string) => {
    const nextGene = getGenesForAssembly(organismId, nextAssemblyId)[0]
    setAssemblyId(nextAssemblyId)
    setGeneId(nextGene?.id ?? '')
    setTranscriptId('')
  }

  const next = () => {
    if (step === 2 && (!gene || (organism.supportsTranscriptAnalysis && !transcriptId))) return
    if (step < 3) setStep(step + 1)
    else if (gene) onComplete({
      projectName: `${gene.symbol} ${experiment} design`,
      experiment, organismId, assembly: assemblyId, geneId: gene.id,
      transcriptId: organism.supportsTranscriptAnalysis ? transcriptId : availableTranscripts[0]?.id ?? '',
      nucleaseId, experimentContext, editingPriority, safetyContext, desiredGuides, editPosition, referenceAllele, desiredAllele,
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
              <label>Organism
                <select value={organismId} onChange={(event) => changeOrganism(event.target.value)}>
                  {organismCategoryOrder.map((category) => (
                    <optgroup label={organismCategoryLabels[category]} key={category}>
                      {organisms.filter((item) => item.category === category).map((item) => <option value={item.id} key={item.id}>{item.scientificName} ({item.commonName})</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label>Reference genome assembly
                <select value={assemblyId} onChange={(event) => changeAssembly(event.target.value)}>
                  {organism.assemblies.map((assembly) => <option value={assembly.id} key={assembly.id}>{assembly.label}{assembly.accession ? ` · ${assembly.accession}` : ''}</option>)}
                </select>
              </label>
              <label>Gene<select value={gene?.id ?? ''} onChange={(event) => setGeneId(event.target.value)}>{availableGenes.map((item) => <option value={item.id} key={item.id}>{item.symbol} — {item.name}</option>)}</select></label>
              <label>Desired number of guides<input type="number" min="1" max="20" value={desiredGuides} onChange={(event) => setDesiredGuides(Number(event.target.value))} /></label>
              {organism.supportsTranscriptAnalysis ? (
                <label className="full-field">Transcript <span className="required">required</span>
                  <select aria-invalid={!transcriptId} value={transcriptId} onChange={(event) => setTranscriptId(event.target.value)}>
                    <option value="">Choose a transcript explicitly…</option>
                    {availableTranscripts.map((item) => <option value={item.id} key={item.id}>{item.id} {item.canonical ? '· canonical' : '· alternative'}</option>)}
                  </select>
                </label>
              ) : (
                <div className="full-field prokaryote-mode"><b>Prokaryotic gene-feature mode</b><span>No transcript selection is required. GuideWise will use the selected gene/CDS feature and will not apply eukaryotic exon or alternative-splicing logic.</span></div>
              )}
            </div>
            <div className="genome-load-status" role="status">
              <span><small>ASSEMBLY</small>{assemblyId}</span>
              <span><small>GENE ANNOTATION</small>{availableGenes.length} demo record{availableGenes.length === 1 ? '' : 's'} loaded</span>
              <span><small>TRANSCRIPT MODEL</small>{organism.supportsTranscriptAnalysis ? `${availableTranscripts.length} loaded` : 'Not applied'}</span>
              <span><small>CHROMOSOME SEQUENCE</small>{gene ? `${gene.chromosome} region loaded` : 'Unavailable'}</span>
            </div>
            <p className="organism-capability-note"><b>{organism.genomeOrganization === 'eukaryotic' ? 'Eukaryotic analysis' : 'Bacterial analysis'}:</b> {organism.annotationNote}</p>
            {organism.supportsTranscriptAnalysis && transcriptId ? (
              <div className="transcript-summary">
                {(() => { const item = availableTranscripts.find((tx) => tx.id === transcriptId)!; return <><span><small>STATUS</small>{item.proteinCoding ? 'Protein coding' : 'Noncoding'}</span><span><small>EXONS</small>{item.exonCount}</span><span><small>CODING LENGTH</small>{item.codingSequenceLength} bp</span><span><small>CANONICAL</small>{item.canonical ? 'Yes (demo)' : 'No'}</span></> })()}
              </div>
            ) : organism.supportsTranscriptAnalysis ? <p className="validation-message">Select a transcript to continue. GuideWise will not silently choose one.</p> : null}
            <details className="custom-genome-panel"><summary>Future custom organism support</summary><div><p>The provider architecture is ready for user-supplied genomes, but this prototype does not parse uploads yet.</p><label>Genome FASTA<input type="file" accept=".fa,.fasta,.fna" disabled /></label><label>Gene annotation GTF/GFF<input type="file" accept=".gtf,.gff,.gff3" disabled /></label><small>Planned validation: contig names, coordinate system, annotation format, and assembly provenance.</small></div></details>
            <details className="nuclease-note"><summary>Cas9 versus SpCas9</summary><p><b>Cas9</b> is a category; <b>SpCas9</b> is one specific member, originally identified in <i>Streptococcus pyogenes</i>. SpCas9 generally creates a double-strand break approximately three base pairs upstream of the PAM, although exact cleavage products can vary.</p></details>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend>{experimentInfo[experiment].title} details</legend>
            <section className="experiment-context-section" aria-labelledby="experiment-context-heading">
              <div className="context-heading"><span className="overline">EXPERIMENT CONTEXT</span><h2 id="experiment-context-heading">Match the nuclease decision to your priorities</h2><p>These answers change the educational recommendation, not the underlying evidence.</p></div>
              <div className="form-grid context-fields">
                <label>What best describes your experiment?
                  <select value={experimentContext} onChange={(event) => setExperimentContext(event.target.value as ExperimentContext)}>
                    <option value="cultured_cell_knockout">Standard gene knockout in cultured cells</option>
                    <option value="crispr_screen">CRISPR screening experiment</option>
                    <option value="exploratory_research">Early-stage academic or exploratory research</option>
                    <option value="primary_cells">Editing primary cells</option>
                    <option value="stem_cells">Editing stem cells</option>
                    <option value="transplantation_cells">Editing cells intended for transplantation</option>
                    <option value="preclinical_therapy">Preclinical therapeutic research</option>
                    <option value="clinical_therapy">Clinical or patient-directed therapeutic development</option>
                    <option value="high_off_target_risk">High off-target-risk target</option>
                    <option value="other">Other / Not sure</option>
                  </select>
                </label>
                <label>What is your main priority?
                  <select value={editingPriority} onChange={(event) => setEditingPriority(event.target.value as EditingPriority)}>
                    <option value="maximize_activity">Highest possible on-target editing activity</option>
                    <option value="minimize_off_targets">Lowest possible off-target risk</option>
                    <option value="balanced">Balance activity and specificity</option>
                    <option value="established_system">Use the most established and widely studied system</option>
                    <option value="small_delivery">Small nuclease for delivery constraints</option>
                    <option value="alternative_pam">Access a target without a suitable NGG PAM</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </label>
                <label className="full-field">Could these edited cells or tissues eventually be used in a patient? <span className="optional">optional safety context</span>
                  <select value={safetyContext} onChange={(event) => setSafetyContext(event.target.value as SafetyContext)}>
                    <option value="research_only">No — research use only</option>
                    <option value="possible_therapy">Possibly — early therapeutic research</option>
                    <option value="preclinical">Yes — preclinical or translational development</option>
                    <option value="clinical">Yes — clinical development</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </label>
              </div>
              <NucleaseRecommendationCard recommendation={nucleaseRecommendation} selectedNucleaseId={nucleaseId} onSelect={setNucleaseId} />
            </section>
            {experiment === 'knockout' && (
              <div className="form-grid">
                <label>Desired number of guides<input type="number" min="1" max="20" value={desiredGuides} onChange={(e) => setDesiredGuides(Number(e.target.value))} /></label>
                <label>Minimum transcript coverage<select defaultValue="80"><option value="100">100%</option><option value="80">80%</option><option value="50">50%</option></select></label>
                {organism.supportsTranscriptAnalysis ? ['Prioritize exons shared across transcripts', 'Avoid first coding exon', 'Avoid final coding exon', 'Prefer known functional protein domains'].map((label, index) => <label className="check-field" key={label}><input type="checkbox" defaultChecked={index !== 1} /> {label}</label>) : <div className="full-field prokaryote-mode"><b>Simplified bacterial knockout logic</b><span>Transcript coverage and exon ranking are neutralized. Review coding position, operon context, essentiality, polarity effects, and regulatory consequences with organism-specific tools.</span></div>}
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
          <button className="primary-button" disabled={step === 2 && (!gene || (organism.supportsTranscriptAnalysis && !transcriptId))} onClick={next}>{step === 3 ? 'Generate demonstration guides' : 'Continue →'}</button>
        </div>
      </div>
    </section>
  )
}
