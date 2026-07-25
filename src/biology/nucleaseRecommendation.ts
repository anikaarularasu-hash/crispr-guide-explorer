import type {
  EditingPriority,
  ExperimentContext,
  NucleaseId,
  NucleaseRecommendation,
  SafetyContext,
} from '../types/crispr'

export interface RecommendationInput {
  context: ExperimentContext
  priority: EditingPriority
  safetyContext: SafetyContext
  specificityScore?: number
  codingOffTargetCount?: number
  guideDataQuality?: 'none' | 'demonstration' | 'real'
  betterGuideAvailable?: boolean
}

const highFidelityContexts: ExperimentContext[] = [
  'primary_cells',
  'stem_cells',
  'transplantation_cells',
  'preclinical_therapy',
  'clinical_therapy',
  'high_off_target_risk',
]

const therapeuticSafety: SafetyContext[] = ['possible_therapy', 'preclinical', 'clinical']

export function recommendNuclease(input: RecommendationInput): NucleaseRecommendation {
  const {
    context,
    priority,
    safetyContext,
    specificityScore,
    codingOffTargetCount,
    guideDataQuality = 'none',
    betterGuideAvailable = false,
  } = input
  const reasons: string[] = []
  const cautions: string[] = [
    'Performance is guide-, locus-, cell-type-, delivery-, and assay-dependent.',
    'A high-fidelity nuclease does not replace guide redesign or experimental off-target validation.',
  ]
  const elevatedHeuristicRisk = specificityScore !== undefined && specificityScore < 70
  const importantOffTargets = codingOffTargetCount !== undefined && codingOffTargetCount > 0
  const higherSpecificityContext = highFidelityContexts.includes(context) || therapeuticSafety.includes(safetyContext)
  const dataBasis = guideDataQuality === 'real'
    ? 'real-guide-data'
    : guideDataQuality === 'demonstration'
      ? 'demonstration-guide-data'
      : 'context-only'

  if (guideDataQuality === 'demonstration') {
    cautions.unshift('GuideWise does not yet have sufficient real off-target data to make a guide-specific nuclease recommendation.')
  }
  if (elevatedHeuristicRisk || importantOffTargets) {
    cautions.unshift(
      guideDataQuality === 'real'
        ? 'This guide has elevated predicted off-target risk. Guide redesign is preferred before relying on a high-fidelity nuclease.'
        : 'A demonstration signal illustrates possible off-target concern, but it is not genome-wide evidence and cannot establish guide risk.',
    )
  }
  if (betterGuideAvailable) {
    return {
      primaryRecommendation: 'Redesign the guide first',
      alternatives: ['SpCas9', 'Sniper-Cas9', 'SpCas9-HF1'],
      reasons: ['A candidate with stronger predicted specificity is available.', 'Nuclease choice should follow guide and PAM review.'],
      cautions,
      nextStep: 'Compare stronger guide candidates and evaluate important off-target sites before selecting a high-fidelity nuclease.',
      confidence: guideDataQuality === 'real' ? 'high' : 'low',
      dataBasis,
    }
  }
  if (priority === 'small_delivery') {
    return {
      primaryRecommendation: 'Consider SaCas9 or another compact nuclease',
      recommendedNucleaseId: 'sacas9',
      alternatives: ['SpCas9', 'Cas12a'],
      reasons: ['Delivery size is the main stated constraint.', 'Sniper-Cas9 is an SpCas9 variant and is not the first solution to a nuclease-size constraint.'],
      cautions: [...cautions, 'PAM compatibility, guide architecture, and delivery format must be reassessed for a different nuclease.'],
      nextStep: 'Confirm delivery constraints and search for guides using the selected nuclease’s actual PAM and guide rules.',
      confidence: 'moderate',
      dataBasis,
    }
  }
  if (priority === 'alternative_pam') {
    return {
      primaryRecommendation: 'Consider Cas12a or another nuclease with a compatible PAM',
      recommendedNucleaseId: 'cas12a',
      alternatives: ['SaCas9', 'engineered PAM-relaxed Cas9 variants'],
      reasons: ['The target lacks or may lack a suitable NGG PAM.', 'Sniper-Cas9 remains NGG-compatible and does not solve an incompatible-PAM problem.'],
      cautions: [...cautions, 'GuideWise currently generates demonstration SpCas9 NGG candidates only.'],
      nextStep: 'Run a nuclease-aware guide search using the correct PAM, guide length, and cut-position model.',
      confidence: 'moderate',
      dataBasis,
    }
  }
  if (priority === 'minimize_off_targets' || higherSpecificityContext) {
    if (priority === 'minimize_off_targets') reasons.push('Minimizing unintended editing is the main stated priority.')
    if (highFidelityContexts.includes(context)) reasons.push('The selected experiment context places increased importance on specificity.')
    if (therapeuticSafety.includes(safetyContext)) reasons.push('The edited material may eventually be used in a therapeutic context, increasing the need for stringent validation.')
    return {
      primaryRecommendation: 'Consider Sniper-Cas9 or another validated high-fidelity Cas9',
      recommendedNucleaseId: 'sniper-cas9',
      alternatives: ['SpCas9-HF1', 'HiFi Cas9', 'eSpCas9', 'SpCas9'],
      reasons,
      cautions: [...cautions, 'On-target activity may differ across guides and biological systems.', 'This is not a clinical recommendation.'],
      nextStep: elevatedHeuristicRisk || importantOffTargets
        ? 'First determine whether a guide with stronger specificity and fewer important off-targets is available.'
        : 'Evaluate candidate guides, important off-target sites, delivery context, and nuclease performance experimentally.',
      confidence: guideDataQuality === 'real' ? 'moderate' : 'low',
      dataBasis,
    }
  }
  if (context === 'cultured_cell_knockout' || context === 'crispr_screen' || priority === 'maximize_activity' || priority === 'established_system') {
    if (context === 'cultured_cell_knockout') reasons.push('This is a standard cultured-cell knockout context.')
    if (context === 'crispr_screen') reasons.push('Established activity and protocol compatibility often matter in screening workflows.')
    if (priority === 'maximize_activity') reasons.push('Strong on-target editing activity is the main stated priority.')
    if (priority === 'established_system') reasons.push('The most established and widely studied system is the main stated priority.')
    return spCas9Recommendation(reasons, cautions, dataBasis)
  }
  return spCas9Recommendation(
    ['SpCas9 is a practical baseline while the experiment remains exploratory or priorities are uncertain.'],
    cautions,
    dataBasis,
    'low',
  )
}

function spCas9Recommendation(
  reasons: string[],
  cautions: string[],
  dataBasis: NucleaseRecommendation['dataBasis'],
  confidence: NucleaseRecommendation['confidence'] = 'moderate',
): NucleaseRecommendation {
  return {
    primaryRecommendation: 'SpCas9',
    recommendedNucleaseId: 'spcas9',
    alternatives: ['Sniper-Cas9', 'SpCas9-HF1', 'HiFi Cas9'],
    reasons: [
      ...reasons,
      'SpCas9 is widely studied, generally maintains strong on-target activity, and is supported by many established protocols.',
    ],
    cautions: [...cautions, 'Predicted specificity and important off-target sites should still be reviewed.'],
    nextStep: 'Confirm a compatible NGG PAM, compare guide specificity, and validate intended and important off-target sites experimentally.',
    confidence,
    dataBasis,
  }
}

export function nucleaseTradeoffNote(nucleaseId: NucleaseId): string {
  const notes: Record<NucleaseId, string> = {
    spcas9: 'Widely studied and often activity-forward; off-target assessment remains essential.',
    'sniper-cas9': 'NGG-compatible high-fidelity SpCas9 variant; activity and specificity changes are guide- and context-dependent.',
    'spcas9-hf1': 'Engineered for higher fidelity; on-target performance can differ by guide and experimental system.',
    espcas9: 'Engineered specificity variant; it does not replace guide redesign or off-target validation.',
    'hifi-cas9': 'High-fidelity protein option; performance depends on guide, locus, delivery, and assay.',
    sacas9: 'Smaller nuclease with different PAM and guide requirements; current GuideWise candidates are not SaCas9-designed.',
    cas12a: 'Different nuclease family with distinct PAM, guide, and cleavage rules; current GuideWise candidates are not Cas12a-designed.',
    other: 'GuideWise does not model this nuclease. Confirm PAM, guide architecture, activity, specificity, and cleavage behavior independently.',
  }
  return notes[nucleaseId]
}
