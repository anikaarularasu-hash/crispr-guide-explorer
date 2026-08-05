import { describe, expect, it } from 'vitest'
import { extractSpCas9Guides } from '../biology/guideGeneration'
import { demonstrationGeneProvider, demonstrationGenomeProvider, genes, getGeneTranscripts, getGenesForAssembly, organisms, resolveGeneRecords } from './mockData'

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
    expect(new Set(organisms.map((item) => item.category))).toEqual(new Set(['mammals', 'fish', 'insects', 'nematodes', 'plants', 'fungi', 'bacteria', 'synthetic']))
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

  it('searches symbols, names, Ensembl, NCBI, and RefSeq identifiers within one assembly', async () => {
    expect(resolveGeneRecords('human', 'GRCh38', 'BRCA')).toEqual(expect.arrayContaining([expect.objectContaining({ symbol: 'BRCA1' }), expect.objectContaining({ symbol: 'BRCA2' })]))
    expect(resolveGeneRecords('human', 'GRCh38', 'DNA repair associated').length).toBeGreaterThan(1)
    expect(resolveGeneRecords('human', 'GRCh38', 'ENSG00000244734')[0].symbol).toBe('HBB')
    expect(resolveGeneRecords('human', 'GRCh38', '3043')[0].symbol).toBe('HBB')
    expect(resolveGeneRecords('human', 'GRCh38', 'NM_000518.5')[0].symbol).toBe('HBB')
    await expect(demonstrationGeneProvider.searchGenes({ organismId: 'human', assemblyId: 'GRCh38', query: 'hemoglobin' })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ symbol: 'HBB' })]))
  })

  it('offers every requested educational category without crossing assemblies', async () => {
    const examples = await demonstrationGeneProvider.getExampleGenes({ organismId: 'human', assemblyId: 'GRCh38' })
    expect(new Set(examples.map((item) => item.exampleCategory))).toEqual(new Set(['blood_disorders', 'cancer', 'cardiovascular', 'neurological', 'muscle_disorders', 'metabolic_liver', 'lung_epithelial', 'immune_system', 'vision', 'basic_research']))
    expect(resolveGeneRecords('mouse', 'GRCm39', 'BRCA1')).toEqual([])
  })
})
