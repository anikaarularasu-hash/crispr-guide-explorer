import { useEffect, useMemo, useState } from 'react'
import {
  getGenesForAssembly,
  getGeneTranscripts,
  exampleGeneCategoryLabels,
  organismCategoryLabels,
  organismCategoryOrder,
  organisms,
  resolveGeneRecords,
} from '../data/mockData'
import { recommendNuclease } from '../biology/nucleaseRecommendation'
import { extractSpCas9Guides } from '../biology/guideGeneration'
import { geneLocation, validateBiologicalTarget } from '../biology/targeting'
import { fetchGene, GeneApiError, type ApiGene } from '../services/geneApi'
import type { BiologicalTarget, EditingPriority, ExperimentContext, ExperimentType, NucleaseId, SafetyContext, Strand, TargetInputMode } from '../types/crispr'
import { NucleaseRecommendationCard } from './NucleaseRecommendationCard'

export interface DesignSetup {
  projectName: string
  experiment: ExperimentType
  organismId: string
  assembly: string
  geneId: string
  transcriptId: string
  target: BiologicalTarget
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

type NcbiLookupStatus = 'idle' | 'loading' | 'success' | 'not_found' | 'api_error' | 'organism_mismatch' | 'assembly_mismatch' | 'unsupported'

export function ExperimentWizard({ initialExperiment, onCancel, onComplete }: { initialExperiment: ExperimentType; onCancel: () => void; onComplete: (setup: DesignSetup) => void }) {
  const [step, setStep] = useState(1)
  const [experiment, setExperiment] = useState(initialExperiment)
  const [organismId, setOrganismId] = useState('human')
  const [assemblyId, setAssemblyId] = useState('GRCh38')
  const [geneId, setGeneId] = useState('hbb')
  const [targetInputMode, setTargetInputMode] = useState<TargetInputMode>('gene')
  const [geneQuery, setGeneQuery] = useState('HBB')
  const [transcriptId, setTranscriptId] = useState('')
  const [regionSequenceId, setRegionSequenceId] = useState('')
  const [regionStart, setRegionStart] = useState(0)
  const [regionEnd, setRegionEnd] = useState(0)
  const [regionStrand, setRegionStrand] = useState<Strand | 'both'>('both')
  const [rawSequence, setRawSequence] = useState('')
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
  const [ncbiGene, setNcbiGene] = useState<ApiGene | null>(null)
  const [ncbiStatus, setNcbiStatus] = useState<NcbiLookupStatus>('idle')
  const [ncbiError, setNcbiError] = useState('')
  const organism = organisms.find((item) => item.id === organismId)!
  const availableGenes = getGenesForAssembly(organismId, assemblyId)
  const gene = availableGenes.find((item) => item.id === geneId)
  const availableTranscripts = gene ? getGeneTranscripts(gene.id) : []
  const assemblyTranscripts = availableGenes.flatMap((item) => getGeneTranscripts(item.id))
  const assembly = organism.assemblies.find((item) => item.id === assemblyId)!
  const rawGuides = targetInputMode === 'raw_sequence' && /^[ACGT\s]+$/i.test(rawSequence) ? extractSpCas9Guides(rawSequence.replace(/\s/g, '')).slice(0, 8) : []
  const biologicalTarget: BiologicalTarget = {
    inputMode: targetInputMode,
    organismId,
    assemblyId,
    geneId: targetInputMode === 'gene' || targetInputMode === 'transcript' ? gene?.id : undefined,
    geneSymbol: targetInputMode === 'gene' || targetInputMode === 'transcript' ? gene?.symbol : undefined,
    transcriptId: targetInputMode === 'transcript' || targetInputMode === 'gene' ? transcriptId || undefined : undefined,
    location: targetInputMode === 'genomic_region' ? {
      assemblyId,
      chromosomeLabel: regionSequenceId,
      start: regionStart,
      end: regionEnd,
      strand: regionStrand === 'both' ? '+' : regionStrand,
    } : gene && (targetInputMode === 'gene' || targetInputMode === 'transcript') ? geneLocation(gene) : undefined,
    rawSequence: targetInputMode === 'raw_sequence' ? rawSequence.replace(/\s/g, '').toUpperCase() : undefined,
  }
  const targetErrors = validateBiologicalTarget(biologicalTarget)
  const supportedDesignMode = targetInputMode === 'gene' || targetInputMode === 'transcript'
  const canContinueTarget = supportedDesignMode
    && (targetInputMode !== 'gene' || ncbiStatus === 'success')
    && targetErrors.length === 0
    && Boolean(gene)
    && (!organism.supportsTranscriptAnalysis || Boolean(transcriptId))
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

  useEffect(() => {
    setNcbiGene(null)
    setNcbiError('')

    if (step !== 2 || targetInputMode !== 'gene') {
      setNcbiStatus('idle')
      return
    }

    const symbol = geneQuery.trim()
    if (!organism.ncbiTaxonId) {
      setNcbiStatus('unsupported')
      return
    }
    if (!symbol || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(symbol)) {
      setNcbiStatus('idle')
      return
    }

    const controller = new AbortController()
    setNcbiStatus('loading')
    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchGene(symbol, organism.ncbiTaxonId!, assemblyId, controller.signal)
        if (result.organism.taxonId !== organism.ncbiTaxonId) {
          setNcbiStatus('organism_mismatch')
          setNcbiError(`NCBI returned ${result.organism.scientificName}, but ${organism.scientificName} is selected.`)
        } else if (!result.location || result.availability.location !== 'available') {
          setNcbiStatus('assembly_mismatch')
          setNcbiError(`NCBI found ${result.symbol}, but did not return a location for ${assembly.label}.`)
        } else {
          setNcbiGene(result)
          setNcbiStatus('success')
        }
      } catch (error) {
        if (controller.signal.aborted) return
        if (error instanceof GeneApiError && error.status === 404) {
          setNcbiStatus('not_found')
          setNcbiError(`NCBI could not find “${symbol}” for ${organism.scientificName} on ${assembly.label}.`)
        } else {
          setNcbiStatus('api_error')
          setNcbiError(error instanceof Error ? error.message : 'The NCBI lookup failed unexpectedly.')
        }
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [step, targetInputMode, geneQuery, organism.ncbiTaxonId, organism.scientificName, assemblyId, assembly.label])

  const changeOrganism = (nextOrganismId: string) => {
    const nextOrganism = organisms.find((item) => item.id === nextOrganismId)!
    const nextAssembly = nextOrganism.assemblies[0].id
    const nextGene = getGenesForAssembly(nextOrganismId, nextAssembly)[0]
    setOrganismId(nextOrganismId)
    setAssemblyId(nextAssembly)
    setGeneId(nextGene?.id ?? '')
    setGeneQuery(nextGene?.symbol ?? '')
    setTranscriptId('')
  }

  const changeAssembly = (nextAssemblyId: string) => {
    const nextGene = getGenesForAssembly(organismId, nextAssemblyId)[0]
    setAssemblyId(nextAssemblyId)
    setGeneId(nextGene?.id ?? '')
    setGeneQuery(nextGene?.symbol ?? '')
    setTranscriptId('')
  }

  const changeGeneQuery = (query: string) => {
    const matches = resolveGeneRecords(organismId, assemblyId, query)
    setGeneQuery(query)
    setGeneId(matches.length === 1 ? matches[0].id : '')
    setTranscriptId('')
  }

  const changeGeneSelection = (nextGeneId: string) => {
    const nextGene = availableGenes.find((item) => item.id === nextGeneId)
    setGeneId(nextGene?.id ?? '')
    setGeneQuery(nextGene?.symbol ?? '')
    setTranscriptId('')
  }

  const changeTranscriptTarget = (nextTranscriptId: string) => {
    const transcript = assemblyTranscripts.find((item) => item.id === nextTranscriptId)
    const transcriptGene = transcript ? availableGenes.find((item) => item.id === transcript.geneId) : undefined
    setTranscriptId(nextTranscriptId)
    setGeneId(transcriptGene?.id ?? '')
    setGeneQuery(transcriptGene?.symbol ?? '')
  }

  const next = () => {
    if (step === 2 && !canContinueTarget) return
    if (step < 3) setStep(step + 1)
    else if (gene) onComplete({
      projectName: `${gene.symbol} ${experiment} design`,
      experiment, organismId, assembly: assemblyId, geneId: gene.id,
      transcriptId: organism.supportsTranscriptAnalysis ? transcriptId : availableTranscripts[0]?.id ?? '',
      target: biologicalTarget,
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
            <div className="data-notice"><b>Real NCBI gene lookup + demonstration guide data</b><span>Gene identity and location come from NCBI. Transcript models, sequences, guide scores, and off-target results remain simulated.</span></div>
            <div className="form-grid">
              <label className="full-field">Target input mode
                <select value={targetInputMode} onChange={(event) => { setTargetInputMode(event.target.value as TargetInputMode); setTranscriptId('') }}>
                  <option value="gene">Gene</option><option value="transcript">Transcript ID</option><option value="genomic_region">Genomic region</option><option value="raw_sequence">Raw DNA sequence</option><option value="custom_genome">Custom genome</option>
                </select>
              </label>
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
              {targetInputMode === 'gene' && <>
                <label>NCBI gene symbol<input value={geneQuery} onChange={(event) => changeGeneQuery(event.target.value)} placeholder="e.g., BRCA1" autoComplete="off" /></label>
                <label>Demonstration gene for guide preview<select value={gene?.id ?? ''} onChange={(event) => changeGeneSelection(event.target.value)}><option value="">No demonstration guide record</option>{availableGenes.map((item) => <option value={item.id} key={item.id}>{item.symbol} — {item.name}</option>)}</select></label>
              </>}
              {targetInputMode === 'transcript' && <label>Transcript ID <span className="required">required</span><select value={transcriptId} onChange={(event) => changeTranscriptTarget(event.target.value)}><option value="">Choose a transcript…</option>{assemblyTranscripts.map((item) => <option value={item.id} key={item.id}>{item.id}</option>)}</select></label>}
              {targetInputMode === 'genomic_region' && <>
                <label>Chromosome or sequence identifier <span className="required">required</span><input value={regionSequenceId} onChange={(event) => setRegionSequenceId(event.target.value)} placeholder="chr17 or NC_000017.11" /></label>
                <label>Strand<select value={regionStrand} onChange={(event) => setRegionStrand(event.target.value as Strand | 'both')}><option value="both">Both strands</option><option value="+">Plus (+)</option><option value="-">Minus (−)</option></select></label>
                <label>Start coordinate <span className="required">required</span><input type="number" min="1" value={regionStart || ''} onChange={(event) => setRegionStart(Number(event.target.value))} /></label>
                <label>End coordinate <span className="required">required</span><input type="number" min="1" value={regionEnd || ''} onChange={(event) => setRegionEnd(Number(event.target.value))} /></label>
              </>}
              {targetInputMode === 'raw_sequence' && <label className="full-field">Raw DNA sequence <span className="required">required</span><textarea value={rawSequence} onChange={(event) => setRawSequence(event.target.value)} placeholder="Paste A, C, G, and T bases…" rows={5} /></label>}
              <label>Desired number of guides<input type="number" min="1" max="20" value={desiredGuides} onChange={(event) => setDesiredGuides(Number(event.target.value))} /></label>
              {targetInputMode === 'gene' && organism.supportsTranscriptAnalysis ? (
                <label className="full-field">Demonstration transcript for guide preview <span className="required">required</span>
                  <select aria-invalid={!transcriptId} value={transcriptId} onChange={(event) => setTranscriptId(event.target.value)}>
                    <option value="">Choose a transcript explicitly…</option>
                    {availableTranscripts.map((item) => <option value={item.id} key={item.id}>{item.id} {item.canonical ? '· canonical' : '· alternative'}</option>)}
                  </select>
                </label>
              ) : targetInputMode === 'gene' && (
                <div className="full-field prokaryote-mode"><b>Prokaryotic gene-feature mode</b><span>No transcript selection is required. GuideWise will use the selected gene/CDS feature and will not apply eukaryotic exon or alternative-splicing logic.</span></div>
              )}
            </div>
            {targetInputMode === 'gene' && <details className="gene-shortcuts"><summary>Browse educational example genes</summary><p>Optional shortcuts from the current demonstration catalog—not the limit of a future connected gene provider.</p><div>{(Object.entries(exampleGeneCategoryLabels) as Array<[keyof typeof exampleGeneCategoryLabels, string]>).map(([category, label]) => {
              const examples = availableGenes.filter((item) => item.exampleCategory === category)
              return examples.length ? <section key={category}><h4>{label}</h4><div>{examples.map((item) => <button type="button" key={item.id} className={item.id === gene?.id ? 'selected' : ''} onClick={() => changeGeneSelection(item.id)}>{item.symbol}</button>)}</div></section> : null
            })}</div></details>}
            {targetInputMode === 'gene' && <div className={`ncbi-lookup-state ${ncbiStatus}`} role={['not_found', 'api_error', 'organism_mismatch', 'assembly_mismatch'].includes(ncbiStatus) ? 'alert' : 'status'} aria-live="polite">
              {ncbiStatus === 'idle' && <><b>Enter a gene symbol</b><span>GuideWise will query NCBI for the selected organism and assembly.</span></>}
              {ncbiStatus === 'loading' && <><b>Searching NCBI…</b><span>Checking “{geneQuery.trim()}” for <i>{organism.scientificName}</i> on {assembly.label}.</span></>}
              {ncbiStatus === 'success' && ncbiGene && <><b>NCBI gene verified</b><span>{ncbiGene.symbol} was returned for <i>{ncbiGene.organism.scientificName}</i>.</span></>}
              {ncbiStatus === 'not_found' && <><b>Gene not found</b><span>{ncbiError} Check the official symbol and selected organism.</span></>}
              {ncbiStatus === 'api_error' && <><b>NCBI lookup unavailable</b><span>{ncbiError} Demonstration metadata will not be substituted.</span></>}
              {ncbiStatus === 'organism_mismatch' && <><b>Organism mismatch</b><span>{ncbiError} GuideWise rejected the response.</span></>}
              {ncbiStatus === 'assembly_mismatch' && <><b>Assembly location unavailable</b><span>{ncbiError} GuideWise will not reuse coordinates from another assembly.</span></>}
              {ncbiStatus === 'unsupported' && <><b>NCBI lookup unavailable for this target</b><span>This custom or synthetic organism does not have an NCBI taxonomy mapping.</span></>}
            </div>}
            {targetInputMode === 'transcript' && <div className="genome-load-status" role="status">
              <span><small>MODE</small>Demonstration transcript</span>
              <span><small>ASSEMBLY</small>{assemblyId}</span>
              <span><small>TRANSCRIPT MODEL</small>{organism.supportsTranscriptAnalysis ? `${availableTranscripts.length} demo records` : 'Not applied'}</span>
            </div>}
            <p className="organism-capability-note"><b>{organism.genomeOrganization === 'eukaryotic' ? 'Eukaryotic analysis' : 'Bacterial analysis'}:</b> {organism.annotationNote}</p>
            {targetInputMode === 'gene' && ncbiStatus === 'success' && ncbiGene?.location && <section className="target-summary real-data-summary" aria-labelledby="target-summary-heading">
              <div><span className="overline">LIVE NCBI DATA</span><h3 id="target-summary-heading">Target summary</h3></div>
              <dl>
                <div><dt>Official symbol</dt><dd>{ncbiGene.symbol}</dd></div><div><dt>Full gene name</dt><dd>{ncbiGene.name}</dd></div>
                <div><dt>Organism</dt><dd><i>{ncbiGene.organism.scientificName}</i> · taxon {ncbiGene.organism.taxonId}</dd></div><div><dt>Assembly</dt><dd>{ncbiGene.location.assemblyName} · {ncbiGene.location.assemblyAccession}</dd></div>
                <div><dt>Chromosome <button className="metric-help" type="button" aria-label="About chromosome" title="GuideWise determines the chromosome automatically from the NCBI gene record for the selected organism and assembly.">?</button></dt><dd>{ncbiGene.location.chromosome} · {ncbiGene.location.sequenceAccession}</dd></div>
                <div><dt>Coordinates</dt><dd>{ncbiGene.location.sequenceAccession}:{ncbiGene.location.start.toLocaleString()}–{ncbiGene.location.end.toLocaleString()}</dd></div><div><dt>Strand</dt><dd>{ncbiGene.location.strand === '+' ? 'plus (+)' : 'minus (−)'}</dd></div>
                <div><dt>Gene type</dt><dd>{ncbiGene.geneType}</dd></div><div><dt>Transcript count</dt><dd>{ncbiGene.transcriptCount ?? 'Not supplied by gene report'}</dd></div>
                <div><dt>NCBI Gene ID</dt><dd>{ncbiGene.ncbiGeneId}</dd></div><div><dt>Ensembl gene ID</dt><dd>{ncbiGene.ensemblGeneIds.join(' · ') || 'Not supplied by NCBI'}</dd></div>
                <div><dt>Aliases</dt><dd>{ncbiGene.aliases.join(' · ') || 'None supplied'}</dd></div><div><dt>Transcript and exon details</dt><dd>Not yet integrated</dd></div>
              </dl>
              {ncbiGene.summary && <p><b>NCBI summary:</b> {ncbiGene.summary}</p>}
              <p>Source: {ncbiGene.source.provider} ({ncbiGene.source.apiVersion}) · retrieved {new Date(ncbiGene.source.retrievedAt).toLocaleString()}{ncbiGene.source.cached ? ' · cached response' : ''}.</p>
            </section>}
            {targetInputMode === 'gene' && ncbiStatus === 'success' && !gene && <p className="validation-message" role="status">NCBI found this gene, but GuideWise has no local demonstration transcript or sequence for it. Real guide generation is not connected yet.</p>}
            {targetInputMode === 'gene' && ncbiStatus === 'success' && gene && <div className="data-notice demo-design-notice"><b>Guide preview remains demonstration-only</b><span>The transcript selector and generated guides below use local simulated records; they are not derived from this NCBI response.</span></div>}
            {targetInputMode === 'raw_sequence' && <section className="raw-sequence-result"><b>{rawGuides.length} candidate SpCas9 guide{rawGuides.length === 1 ? '' : 's'} found on both DNA strands</b><p>PAM discovery works on this sequence, but GuideWise cannot invent chromosome location, exon annotations, transcript coverage, or genome-wide specificity until the sequence is mapped.</p>{rawGuides.length > 0 && <div>{rawGuides.map((guide) => <code key={`${guide.strand}-${guide.localStart}`}>{guide.sequence} · {guide.pamSequence} · {guide.strand}</code>)}</div>}</section>}
            {targetInputMode === 'genomic_region' && <>{targetErrors.map((error) => <p className="validation-message" role="alert" key={error}>{error}</p>)}<p className="field-help">Region lookup requires a sequence provider for {assembly.label}. This demonstration validates coordinates but does not fetch arbitrary chromosome intervals.</p></>}
            {targetInputMode === 'custom_genome' && <section className="custom-upload-mode"><b>Future custom genome workspace</b><p>Upload parsing and indexing are not enabled yet. Planned inputs preserve assembly identity and sequence accessions.</p><label>Genome FASTA<input type="file" accept=".fa,.fasta,.fna" disabled /></label><label>GFF3 or GTF annotation<input type="file" accept=".gff,.gff3,.gtf" disabled /></label></section>}
            {targetInputMode === 'gene' && organism.supportsTranscriptAnalysis && transcriptId ? (
              <div className="transcript-summary" aria-label="Demonstration transcript details">
                {(() => { const item = availableTranscripts.find((tx) => tx.id === transcriptId)!; return <><span><small>STATUS</small>{item.proteinCoding ? 'Protein coding' : 'Noncoding'}</span><span><small>EXONS</small>{item.exonCount}</span><span><small>CODING LENGTH</small>{item.codingSequenceLength} bp</span><span><small>CANONICAL</small>{item.canonical ? 'Yes (demo)' : 'No'}</span></> })()}
              </div>
            ) : targetInputMode === 'gene' && organism.supportsTranscriptAnalysis && gene ? <p className="validation-message">Select a transcript to continue. GuideWise will not silently choose one.</p> : null}
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
                <label>Selected transcription start site<input type="number" value={gene?.transcriptionStartSite ?? 0} readOnly /></label>
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
          <button className="primary-button" disabled={step === 2 && !canContinueTarget} onClick={next}>{step === 3 ? 'Generate demonstration guides' : 'Continue →'}</button>
        </div>
      </div>
    </section>
  )
}
