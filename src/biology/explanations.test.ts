import { describe, expect, it } from 'vitest'
import { explainGuide } from './explanations'
import { createRankedGuides } from './candidateFactory'
import { genes, getGeneTranscripts } from '../data/mockData'

const gene = genes[0]
const guide = createRankedGuides(gene, getGeneTranscripts(gene.id)[0], 'knockout', gene.genomicStart + 56, [-400, -50])[0]

describe('deterministic explanations', () => {
  it('mentions a strength, weakness, experiment context, and uncertainty', () => {
    const explanation = explainGuide(guide, 'knockout')
    expect(explanation).toMatch(/strongest heuristic/i)
    expect(explanation).toMatch(/concern|unmodeled/i)
    expect(explanation).toMatch(/coding|transcript/i)
    expect(explanation).toMatch(/not a guarantee/i)
  })

  it('uses knock-in context when appropriate', () => {
    expect(explainGuide(guide, 'knockin')).toMatch(/intended edit/i)
  })
})
