import { describe, expect, it } from 'vitest'
import { nucleaseTradeoffNote, recommendNuclease } from './nucleaseRecommendation'

describe('transparent nuclease recommendations', () => {
  it('recommends established SpCas9 for a routine cultured-cell knockout', () => {
    const result = recommendNuclease({
      context: 'cultured_cell_knockout',
      priority: 'maximize_activity',
      safetyContext: 'research_only',
    })
    expect(result.primaryRecommendation).toBe('SpCas9')
    expect(result.recommendedNucleaseId).toBe('spcas9')
    expect(result.reasons.join(' ')).toMatch(/cultured-cell knockout|on-target editing activity/i)
  })

  it('suggests evaluating high-fidelity Cas9 when off-target minimization is the priority', () => {
    const result = recommendNuclease({
      context: 'primary_cells',
      priority: 'minimize_off_targets',
      safetyContext: 'possible_therapy',
    })
    expect(result.primaryRecommendation).toMatch(/Consider Sniper-Cas9/)
    expect(result.recommendedNucleaseId).toBe('sniper-cas9')
    expect(result.confidence).toBe('low')
    expect(result.cautions.join(' ')).toMatch(/does not replace guide redesign/i)
  })

  it('increases specificity emphasis without claiming a clinical recommendation', () => {
    const result = recommendNuclease({
      context: 'clinical_therapy',
      priority: 'balanced',
      safetyContext: 'clinical',
    })
    expect(result.primaryRecommendation).toMatch(/high-fidelity/i)
    expect(result.reasons.join(' ')).toMatch(/therapeutic context/i)
    expect(result.cautions.join(' ')).toMatch(/not a clinical recommendation/i)
  })

  it('recommends guide redesign before relying on a high-fidelity nuclease when a stronger guide is available', () => {
    const result = recommendNuclease({
      context: 'high_off_target_risk',
      priority: 'minimize_off_targets',
      safetyContext: 'research_only',
      specificityScore: 55,
      codingOffTargetCount: 1,
      guideDataQuality: 'real',
      betterGuideAvailable: true,
    })
    expect(result.primaryRecommendation).toBe('Redesign the guide first')
    expect(result.nextStep).toMatch(/stronger guide candidates/i)
  })

  it('does not use demonstration scores as real guide-specific evidence', () => {
    const result = recommendNuclease({
      context: 'cultured_cell_knockout',
      priority: 'balanced',
      safetyContext: 'research_only',
      specificityScore: 40,
      codingOffTargetCount: 1,
      guideDataQuality: 'demonstration',
    })
    expect(result.dataBasis).toBe('demonstration-guide-data')
    expect(result.cautions.join(' ')).toMatch(/does not yet have sufficient real off-target data/i)
    expect(result.cautions.join(' ')).toMatch(/not genome-wide evidence/i)
  })

  it('uses delivery and PAM constraints before high-fidelity SpCas9', () => {
    expect(recommendNuclease({
      context: 'exploratory_research',
      priority: 'small_delivery',
      safetyContext: 'research_only',
    }).recommendedNucleaseId).toBe('sacas9')
    expect(recommendNuclease({
      context: 'exploratory_research',
      priority: 'alternative_pam',
      safetyContext: 'research_only',
    }).recommendedNucleaseId).toBe('cas12a')
  })

  it('provides trade-off notes for manual overrides', () => {
    expect(nucleaseTradeoffNote('sniper-cas9')).toMatch(/guide- and context-dependent/i)
    expect(nucleaseTradeoffNote('cas12a')).toMatch(/not Cas12a-designed/i)
  })
})
