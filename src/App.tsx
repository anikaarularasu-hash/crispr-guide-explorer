import { useMemo, useState } from 'react'
import { ExperimentWizard, type DesignSetup } from './components/ExperimentWizard'
import { ResultsWorkspace } from './components/ResultsWorkspace'
import { LearnPage } from './components/LearnPage'
import { createRankedGuides } from './biology/candidateFactory'
import { genes, getGeneTranscripts, mockDataDisclosure } from './data/mockData'
import type { ExperimentType } from './types/crispr'

type View = 'home' | 'design' | 'results' | 'learn'

const experimentCards: Array<{ id: ExperimentType; title: string; tag: string; description: string }> = [
  { id: 'knockout', title: 'Knockout', tag: 'Disrupt function', description: 'Disrupt a gene by creating insertions or deletions that may prevent production of a functional protein.' },
  { id: 'knockin', title: 'Knock-in', tag: 'Precise change', description: 'Introduce a precise DNA change using a donor template and homology-directed repair.' },
  { id: 'crispra', title: 'CRISPRa', tag: 'Increase expression', description: 'Increase gene expression without directly changing the DNA sequence.' },
  { id: 'crispri', title: 'CRISPRi', tag: 'Reduce expression', description: 'Reduce gene expression without creating a conventional DNA break.' },
]

function App() {
  const [view, setView] = useState<View>('home')
  const [initialExperiment, setInitialExperiment] = useState<ExperimentType>('knockout')
  const [setup, setSetup] = useState<DesignSetup | null>(null)

  const results = useMemo(() => {
    if (!setup) return []
    const gene = genes.find((item) => item.id === setup.geneId)
    const transcript = getGeneTranscripts(setup.geneId).find((item) => item.id === setup.transcriptId)
    if (!gene || !transcript) return []
    return createRankedGuides(gene, transcript, setup.experiment, setup.editPosition, [setup.windowStart, setup.windowEnd], setup.nucleaseId)
  }, [setup])

  const beginDesign = (experiment = initialExperiment) => {
    setInitialExperiment(experiment)
    setView('design')
  }

  return (
    <div className="app-shell">
      <div className="demo-banner" role="status">
        <span aria-hidden="true">◇</span> {mockDataDisclosure}
      </div>
      <header className="topbar">
        <button className="wordmark" type="button" onClick={() => setView('home')} aria-label="GuideWise home">
          <span className="mark">GW</span>
          <span>GuideWise<small>CRISPR DESIGN & EDUCATION</small></span>
        </button>
        <nav aria-label="Main navigation">
          <button className={view === 'design' || view === 'results' ? 'active' : ''} onClick={() => beginDesign()}>Design</button>
          <button className={view === 'learn' ? 'active' : ''} onClick={() => setView('learn')}>Learn</button>
          <a href="#scientific-disclaimer">Limitations</a>
        </nav>
        <button className="topbar-cta" onClick={() => beginDesign()}>New design</button>
      </header>

      {view === 'home' && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="kicker"><span /> EXPERIMENT-AWARE GUIDE DESIGN</div>
              <h1>The right guide depends on <em>your experiment.</em></h1>
              <p className="hero-subtitle">GuideWise helps scientists compare CRISPR guide RNA candidates in biological context—without pretending one guide is universally perfect.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => beginDesign()}>Design guides <span aria-hidden="true">→</span></button>
                <button className="text-button" onClick={() => setView('learn')}>Explore the science</button>
              </div>
              <div className="principles" aria-label="Product principles">
                <span><b>01</b> Goal-aware ranking</span>
                <span><b>02</b> Transparent heuristics</span>
                <span><b>03</b> Validation required</span>
              </div>
            </div>
            <div className="hero-visual" aria-label="Conceptual comparison of guide candidates">
              <div className="visual-top"><span>Candidate comparison</span><span className="live-pill">DEMO MODEL</span></div>
              <div className="dna-ruler"><span>5′</span><div>{'ACGTCCGATGCTAACC'.split('').map((base, index) => <i key={index} className={index > 10 ? 'pam-base' : ''}>{base}</i>)}</div><span>3′</span></div>
              {[['Guide A', 86, 'Activity'], ['Guide B', 94, 'Specificity'], ['Guide C', 78, 'Coverage']].map(([name, score, label], index) => (
                <div className={`candidate-line candidate-${index}`} key={name}>
                  <span className="candidate-name">{name}</span>
                  <div className="candidate-bar"><i style={{ width: `${score}%` }} /></div>
                  <b>{score}</b><small>{label}</small>
                </div>
              ))}
              <p>No single winner. Different strengths answer different experimental needs.</p>
            </div>
          </section>

          <section className="experiment-section" aria-labelledby="experiment-heading">
            <div className="section-intro">
              <div><span className="section-number">01</span><h2 id="experiment-heading">Start with the biological goal</h2></div>
              <p>The selected experiment changes preferred locations, setup questions, warning rules, and ranking weights.</p>
            </div>
            <div className="experiment-grid">
              {experimentCards.map((card, index) => (
                <button className="experiment-card" key={card.id} onClick={() => beginDesign(card.id)}>
                  <span className="card-index">0{index + 1}</span>
                  <span className={`experiment-icon icon-${card.id}`} aria-hidden="true">{card.id === 'knockout' ? '×' : card.id === 'knockin' ? '+' : card.id === 'crispra' ? '↑' : '↓'}</span>
                  <span className="card-tag">{card.tag}</span>
                  <strong>{card.title}</strong>
                  <span className="card-description">{card.description}</span>
                  <span className="card-link">Configure experiment →</span>
                </button>
              ))}
            </div>
          </section>

          <section className="context-section">
            <div className="context-quote">
              <span className="quote-mark">“</span>
              <blockquote>Guide selection is a decision under uncertainty—not a search for a magic sequence.</blockquote>
            </div>
            <div className="context-copy">
              <span className="overline">WHY CONTEXT MATTERS</span>
              <h2>Strong for a knockout.<br />Wrong for a knock-in.</h2>
              <p>A coding-exon guide with broad transcript coverage may suit a knockout. A guide cutting two bases from an intended edit may be more useful for HDR, even with slightly lower predicted activity.</p>
              <p className="fine-print">Activity, specificity, transcript structure, target location, nuclease, delivery, and cell type can all change the decision.</p>
            </div>
          </section>
        </main>
      )}

      {view === 'design' && (
        <main className="workspace-main">
          <ExperimentWizard
            initialExperiment={initialExperiment}
            onCancel={() => setView('home')}
            onComplete={(value) => { setSetup(value); setView('results') }}
          />
        </main>
      )}

      {view === 'results' && setup && (
        <main className="workspace-main">
          <ResultsWorkspace setup={setup} initialGuides={results} onBack={() => setView('design')} />
        </main>
      )}

      {view === 'learn' && <LearnPage onDesign={() => beginDesign()} />}

      <footer id="scientific-disclaimer" className="site-footer">
        <div><span className="mark">GW</span><strong>GuideWise</strong></div>
        <p><b>Scientific disclaimer.</b> GuideWise predictions are computational estimates. Guide designs require experimental validation before research or clinical use. This prototype is not research-grade and does not perform genome-wide off-target analysis.</p>
        <span>Prototype v0.2 · Demonstration data</span>
      </footer>
    </div>
  )
}

export default App
