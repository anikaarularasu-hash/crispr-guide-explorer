import { describe, expect, it } from 'vitest'
import { extractSpCas9Guides } from '../biology/guideGeneration'
import { demonstrationGenomeProvider, genes, getGeneTranscripts, getGenesForAssembly, organisms } from './mockData'

describe('multi-organism demonstration genomes', () => {
  it('includes the requested research species in biological categories', () => {
    expect(organisms.map((item) => item.scientificName)).toEqual(expect.arrayContaining([
      'Homo sapiens',
      'Mus musculus',
      'Rattus norvegicus',
      'Danio rerio',
      'Drosophila melanogaster',
      'Caenorhabditis elegans',
      'Saccharomyces cerevisiae',
      'Arabidopsis thaliana',
      'Escherichia coli',
    ]))
    expect(new Set(organisms.map((item) => item.category))).toEqual(new Set(['mammals', 'fish', 'insects', 'nematodes', 'plants', 'fungi', 'bacteria']))
  })

  it('binds each organism assembly to annotations, transcripts, and sequence', async () => {
    for (const organism of organisms) {
      for (const assembly of organism.assemblies) {
        const assemblyGenes = getGenesForAssembly(organism.id, assembly.id)
        expect(assemblyGenes.length).toBeGreaterThan(0)
        for (const gene of assemblyGenes) {
          expect(gene.sequence).toMatch(/^[ACGT]+$/)
          expect(getGeneTranscripts(gene.id).length).toBeGreaterThan(0)
          await expect(demonstrationGenomeProvider.getSequence({ organismId: organism.id, assemblyId: assembly.id, geneId: gene.id })).resolves.toBe(gene.sequence)
        }
      }
    }
  })

  it('does not mix records across organisms or assemblies', async () => {
    await expect(demonstrationGenomeProvider.getGenes({ organismId: 'zebrafish', assemblyId: 'GRCz11' })).resolves.toEqual(
      genes.filter((gene) => gene.organismId === 'zebrafish'),
    )
    await expect(demonstrationGenomeProvider.getSequence({ organismId: 'mouse', assemblyId: 'GRCm39', geneId: 'hbb' })).resolves.toBe('')
  })

  it('uses a simplified single-CDS model for bacteria', () => {
    const bacterium = organisms.find((item) => item.id === 'e-coli')!
    const gene = getGenesForAssembly('e-coli', 'ASM584v2')[0]
    const features = getGeneTranscripts(gene.id)
    expect(bacterium).toMatchObject({ genomeOrganization: 'prokaryotic', supportsTranscriptAnalysis: false, supportsAlternativeSplicing: false })
    expect(features).toHaveLength(1)
    expect(features[0].exons).toHaveLength(1)
  })

  it('runs the same PAM discovery function on every organism sequence', () => {
    for (const gene of genes) expect(extractSpCas9Guides(gene.sequence).length).toBeGreaterThan(0)
  })
})
