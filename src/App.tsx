import { useMemo, useState } from 'react'
import { findForwardGuides, normalizeSequence } from './lib/crispr'

const EXAMPLE = '1  ATCGATCGAT CGATCGATCG TGG\n24 GCAATTAACC GGTTAACCGG AGG'

const experimentGoals = [
  { id: 'knockout', label: 'Knockout', description: 'Disrupt or disable a gene.' },
  { id: 'knockin', label: 'Knock-in', description: 'Introduce a specific DNA change.' },
  { id: 'crispra', label: 'CRISPRa', description: 'Increase expression of a target gene.' },
  { id: 'crispri', label: 'CRISPRi', description: 'Reduce expression without cutting DNA.' },
] as const

type ExperimentGoal = (typeof experimentGoals)[number]['id']

function App() {
  const [input, setInput] = useState('')
  const [goal, setGoal] = useState<ExperimentGoal | null>(null)

  const result = useMemo(() => {
    if (!input.trim()) return { sequence: '', guides: [], error: '' }
    try {
      const sequence = normalizeSequence(input)
      return { sequence, guides: findForwardGuides(sequence), error: '' }
    } catch (error) {
      return { sequence: '', guides: [], error: error instanceof Error ? error.message : 'Invalid DNA sequence.' }
    }
  }, [input])

  return (
    <main>
      <header className="hero">
        <div className="eyebrow">Learning tool · Forward strand only</div>
        <h1>CRISPR Guide Explorer</h1>
        <p>Paste a DNA sequence to find 20-base guide candidates immediately upstream of SpCas9 <strong>NGG</strong> PAMs.</p>
      </header>

      <section className="panel goal-panel" aria-labelledby="goal-heading">
        <div className="section-heading">
          <div>
            <span className="step">01</span>
            <h2 id="goal-heading">What do you want to explore?</h2>
          </div>
        </div>
        <p className="goal-intro">Choose an educational experiment goal before examining potential guide sequences.</p>
        <div className="goal-grid">
          {experimentGoals.map((option) => (
            <button
              className={`goal-card${goal === option.id ? ' selected' : ''}`}
              type="button"
              key={option.id}
              onClick={() => setGoal(option.id)}
              aria-pressed={goal === option.id}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      {goal && (
        <>
          <section className="panel input-panel" aria-labelledby="sequence-heading">
            <div className="section-heading">
              <div>
                <span className="step">02</span>
                <h2 id="sequence-heading">DNA sequence</h2>
              </div>
              <button className="example-button" type="button" onClick={() => setInput(EXAMPLE)}>Load example</button>
            </div>
            <p className="selected-goal">Exploring: <strong>{experimentGoals.find((option) => option.id === goal)?.label}</strong></p>
            <label htmlFor="dna-input">Paste bases, spaces, and line numbers</label>
            <textarea
              id="dna-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="ATCGATCGATCGATCGATCGTGG..."
              spellCheck={false}
            />
            <div className="input-meta" aria-live="polite">
              <span>{result.sequence.length.toLocaleString()} normalized bases</span>
              <span>A · T · C · G only</span>
            </div>
            {result.error && <p className="error" role="alert">{result.error}</p>}
          </section>

          <section className="results" aria-labelledby="results-heading">
            <div className="section-heading results-heading">
              <div>
                <span className="step">03</span>
                <h2 id="results-heading">Candidate guides</h2>
              </div>
              <span className="count">{result.guides.length} found</span>
            </div>

            {!input.trim() ? (
              <div className="empty">Results will appear here after you paste a sequence.</div>
            ) : !result.error && result.guides.length === 0 ? (
              <div className="empty">No forward-strand NGG sites with 20 upstream bases were found.</div>
            ) : (
              <div className="guide-grid">
                {result.guides.map((candidate, index) => (
                  <article className="guide-card" key={`${candidate.pamPosition}-${candidate.guide}`}>
                    <div className="card-number">Guide {String(index + 1).padStart(2, '0')}</div>
                    <code className="guide-sequence">{candidate.guide}</code>
                    <dl>
                      <div><dt>PAM</dt><dd><code>{candidate.pam}</code></dd></div>
                      <div><dt>PAM position</dt><dd>{candidate.pamPosition}</dd></div>
                      <div><dt>GC</dt><dd>{candidate.gcPercentage.toFixed(1)}%</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer>
        <p><strong>Educational use only.</strong> This explorer is not for clinical guide design, diagnosis, or treatment decisions. Positions are zero-based in the normalized forward strand.</p>
        <p className="copyright">© Anika Arularasu</p>
      </footer>
    </main>
  )
}

export default App
