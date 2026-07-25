import { useState } from 'react'
import { nucleases } from '../data/mockData'
import { nucleaseTradeoffNote } from '../biology/nucleaseRecommendation'
import type { NucleaseId, NucleaseRecommendation } from '../types/crispr'

export function NucleaseRecommendationCard({
  recommendation,
  selectedNucleaseId,
  onSelect,
}: {
  recommendation: NucleaseRecommendation
  selectedNucleaseId: NucleaseId
  onSelect?: (id: NucleaseId) => void
}) {
  const [manualChoice, setManualChoice] = useState(false)
  const selected = nucleases.find((item) => item.id === selectedNucleaseId)
  const useRecommendation = () => {
    if (recommendation.recommendedNucleaseId && onSelect) onSelect(recommendation.recommendedNucleaseId)
    setManualChoice(false)
  }

  return (
    <section className="nuclease-recommendation" aria-labelledby="nuclease-recommendation-heading">
      <div className="recommendation-topline">
        <span>Educational decision support</span>
        <span className={`confidence confidence-${recommendation.confidence}`}>{recommendation.confidence} confidence</span>
      </div>
      <div className="recommendation-body">
        <div className="recommendation-primary">
          <span className="overline">SUGGESTED NUCLEASE OR NEXT STEP</span>
          <h3 id="nuclease-recommendation-heading">{recommendation.primaryRecommendation}</h3>
          <p className="data-basis">
            {recommendation.dataBasis === 'demonstration-guide-data'
              ? 'This recommendation includes demonstration or heuristic guide data and must not be used to make experimental or clinical decisions.'
              : recommendation.dataBasis === 'context-only'
                ? 'This recommendation is based on the experiment context you entered, not guide-specific off-target evidence.'
                : 'This recommendation includes supplied guide-level data; independent validation is still required.'}
          </p>
          {onSelect && (
            <div className="recommendation-actions">
              {recommendation.recommendedNucleaseId && <button className="primary-button" type="button" onClick={useRecommendation}>Use recommendation</button>}
              <button className="secondary-button" type="button" onClick={() => setManualChoice((open) => !open)}>Choose a different nuclease</button>
            </div>
          )}
          {onSelect && manualChoice && (
            <label className="manual-nuclease">
              Manual nuclease selection
              <select value={selectedNucleaseId} onChange={(event) => onSelect(event.target.value as NucleaseId)}>
                {nucleases.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <small>{nucleaseTradeoffNote(selectedNucleaseId)}</small>
            </label>
          )}
          {onSelect && !manualChoice && selected && <p className="current-selection">Current selection: <b>{selected.name}</b> · {nucleaseTradeoffNote(selectedNucleaseId)}</p>}
        </div>
        <div className="recommendation-evidence">
          <div><h4>Why</h4><ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          <div><h4>Alternatives</h4><p>{recommendation.alternatives.join(' · ')}</p></div>
          <div><h4>Recommended next step</h4><p>{recommendation.nextStep}</p></div>
        </div>
      </div>
      <div className="recommendation-cautions">
        <strong>Important</strong>
        <ul>{recommendation.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul>
      </div>
      <ol className="decision-hierarchy" aria-label="Nuclease decision hierarchy">
        <li><b>1</b> Find a stronger guide</li><li><b>2</b> Confirm PAM compatibility</li><li><b>3</b> Evaluate off-target sites</li><li><b>4</b> Consider high fidelity</li><li><b>5</b> Validate experimentally</li>
      </ol>
    </section>
  )
}
