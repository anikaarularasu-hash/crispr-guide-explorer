import type {
  Gene,
  GenomeDataProvider,
  Nuclease,
  Organism,
  OrganismCategory,
  Transcript,
} from '../types/crispr'

export const organismCategoryLabels: Record<OrganismCategory, string> = {
  mammals: 'Mammals',
  fish: 'Fish',
  insects: 'Insects',
  nematodes: 'Nematodes',
  plants: 'Plants',
  fungi: 'Fungi',
  bacteria: 'Bacteria',
}

export const organismCategoryOrder: OrganismCategory[] = ['mammals', 'fish', 'insects', 'nematodes', 'plants', 'fungi', 'bacteria']

export const organisms: Organism[] = [
  {
    id: 'human', scientificName: 'Homo sapiens', commonName: 'Human', category: 'mammals', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'GRCh38', label: 'GRCh38', accession: 'GCA_000001405.29', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' }],
  },
  {
    id: 'mouse', scientificName: 'Mus musculus', commonName: 'Mouse', category: 'mammals', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'GRCm39', label: 'GRCm39', accession: 'GCA_000001635.9', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' }],
  },
  {
    id: 'rat', scientificName: 'Rattus norvegicus', commonName: 'Rat', category: 'mammals', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'mRatBN7.2', label: 'mRatBN7.2', accession: 'GCA_015227675.2', source: 'Ensembl reference assembly', provenance: 'demonstration' }],
  },
  {
    id: 'zebrafish', scientificName: 'Danio rerio', commonName: 'Zebrafish', category: 'fish', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'GRCz11', label: 'GRCz11', accession: 'GCA_000002035.4', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' }],
  },
  {
    id: 'fruit-fly', scientificName: 'Drosophila melanogaster', commonName: 'Fruit fly', category: 'insects', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'BDGP6.46', label: 'BDGP6.46', source: 'FlyBase / Ensembl Metazoa', provenance: 'demonstration' }],
  },
  {
    id: 'c-elegans', scientificName: 'Caenorhabditis elegans', commonName: 'C. elegans', category: 'nematodes', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'WBcel235', label: 'WBcel235', accession: 'GCA_000002985.3', source: 'WormBase / Ensembl Metazoa', provenance: 'demonstration' }],
  },
  {
    id: 'arabidopsis', scientificName: 'Arabidopsis thaliana', commonName: 'Arabidopsis', category: 'plants', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'TAIR10', label: 'TAIR10', accession: 'GCA_000001735.1', source: 'TAIR / Ensembl Plants', provenance: 'demonstration' }],
  },
  {
    id: 'yeast', scientificName: 'Saccharomyces cerevisiae', commonName: 'Budding yeast', category: 'fungi', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: false,
    annotationNote: 'Exon analysis is available; extensive alternative-splicing logic is de-emphasized for this demonstration.',
    assemblies: [{ id: 'R64-1-1', label: 'R64-1-1', accession: 'GCA_000146045.2', source: 'Saccharomyces Genome Database / Ensembl Fungi', provenance: 'demonstration' }],
  },
  {
    id: 'e-coli', scientificName: 'Escherichia coli', commonName: 'E. coli K-12 MG1655', category: 'bacteria', genomeOrganization: 'prokaryotic',
    supportsTranscriptAnalysis: false, supportsAlternativeSplicing: false,
    annotationNote: 'Prokaryotic mode uses gene/CDS features and does not apply eukaryotic exon or alternative-transcript coverage logic.',
    assemblies: [{ id: 'ASM584v2', label: 'ASM584v2', accession: 'GCF_000005845.2', source: 'NCBI RefSeq', provenance: 'demonstration' }],
  },
]

export const nucleases: Nuclease[] = [
  { id: 'spcas9', name: 'SpCas9', fullName: 'Streptococcus pyogenes Cas9', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'sniper-cas9', name: 'Sniper-Cas9', fullName: 'Sniper-Cas9 high-fidelity SpCas9 variant', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'spcas9-hf1', name: 'SpCas9-HF1', fullName: 'SpCas9 high-fidelity variant 1', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'espcas9', name: 'eSpCas9', fullName: 'Enhanced-specificity SpCas9', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'hifi-cas9', name: 'HiFi Cas9', fullName: 'High-fidelity Cas9 protein variant', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'sacas9', name: 'SaCas9', fullName: 'Staphylococcus aureus Cas9', pam: { pattern: 'NNGRRT', guideLength: 21, pamLength: 6, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'cas12a', name: 'Cas12a', fullName: 'Cas12a nuclease family', pam: { pattern: 'TTTV', guideLength: 23, pamLength: 4, cutOffsetFromPam: 18 }, catalyticallyActive: true },
  { id: 'other', name: 'Other', fullName: 'User-selected nuclease not modeled by GuideWise', pam: { pattern: 'varies', guideLength: 20, pamLength: 0, cutOffsetFromPam: 0 }, catalyticallyActive: true },
]

const sequence = [
  'ATGCTGACCTGACTGACTGATGG', 'GCTAACGTCGATCGGATCCACGG', 'CCAGTTACGATGCCATGATCTGG', 'CCATGATCGTAGCTAACGTCCAA',
  'TGGACCGTATCGGCTAATGCTGG', 'AATCGGCCATGCTAGCTAACCGG', 'TTAGCGATCGTACCATGGCTAGG', 'CCAGATCGATGCTAACCGTAGCA',
].join('')

interface GeneSeed {
  id: string
  organismId: string
  assembly: string
  symbol: string
  name: string
  chromosome: string
  genomicStart: number
  alternativeTranscripts: boolean
}

const geneSeeds: GeneSeed[] = [
  { id: 'hbb', organismId: 'human', assembly: 'GRCh38', symbol: 'HBB', name: 'Hemoglobin subunit beta', chromosome: '11', genomicStart: 5_225_464, alternativeTranscripts: true },
  { id: 'cftr', organismId: 'human', assembly: 'GRCh38', symbol: 'CFTR', name: 'CF transmembrane conductance regulator', chromosome: '7', genomicStart: 117_480_025, alternativeTranscripts: true },
  { id: 'pcsk9', organismId: 'human', assembly: 'GRCh38', symbol: 'PCSK9', name: 'Proprotein convertase subtilisin/kexin type 9', chromosome: '1', genomicStart: 55_505_221, alternativeTranscripts: true },
  { id: 'tp53', organismId: 'human', assembly: 'GRCh38', symbol: 'TP53', name: 'Tumor protein p53', chromosome: '17', genomicStart: 7_668_401, alternativeTranscripts: true },
  { id: 'mouse-trp53', organismId: 'mouse', assembly: 'GRCm39', symbol: 'Trp53', name: 'Transformation related protein 53', chromosome: '11', genomicStart: 69_569_000, alternativeTranscripts: true },
  { id: 'rat-tp53', organismId: 'rat', assembly: 'mRatBN7.2', symbol: 'Tp53', name: 'Tumor protein p53', chromosome: '10', genomicStart: 56_000_000, alternativeTranscripts: true },
  { id: 'zfish-tp53', organismId: 'zebrafish', assembly: 'GRCz11', symbol: 'tp53', name: 'Tumor protein p53', chromosome: '5', genomicStart: 35_000_000, alternativeTranscripts: true },
  { id: 'fly-white', organismId: 'fruit-fly', assembly: 'BDGP6.46', symbol: 'white', name: 'white', chromosome: 'X', genomicStart: 2_790_000, alternativeTranscripts: true },
  { id: 'worm-unc54', organismId: 'c-elegans', assembly: 'WBcel235', symbol: 'unc-54', name: 'Myosin class II heavy chain', chromosome: 'I', genomicStart: 14_800_000, alternativeTranscripts: true },
  { id: 'arabidopsis-pds3', organismId: 'arabidopsis', assembly: 'TAIR10', symbol: 'PDS3', name: 'Phytoene desaturation 3', chromosome: '4', genomicStart: 8_200_000, alternativeTranscripts: true },
  { id: 'yeast-ade2', organismId: 'yeast', assembly: 'R64-1-1', symbol: 'ADE2', name: 'Phosphoribosylaminoimidazole carboxylase', chromosome: 'XV', genomicStart: 560_000, alternativeTranscripts: false },
  { id: 'ecoli-lacz', organismId: 'e-coli', assembly: 'ASM584v2', symbol: 'lacZ', name: 'Beta-galactosidase', chromosome: 'NC_000913.3', genomicStart: 360_000, alternativeTranscripts: false },
]

function transcriptIdsFor(seed: GeneSeed): string[] {
  if (seed.organismId === 'human') return [`ENST-${seed.symbol}-001`, `ENST-${seed.symbol}-002`]
  if (seed.organismId === 'e-coli') return [`CDS-${seed.symbol.toUpperCase()}-001`]
  const prefix = `${seed.organismId.toUpperCase()}-${seed.symbol.toUpperCase()}`
  return seed.alternativeTranscripts ? [`${prefix}-T1`, `${prefix}-T2`] : [`${prefix}-T1`]
}

function makeTranscripts(seed: GeneSeed): Transcript[] {
  const ids = transcriptIdsFor(seed)
  if (seed.organismId === 'e-coli') {
    return [{
      id: ids[0], geneId: seed.id, organismId: seed.organismId, assemblyId: seed.assembly,
      proteinCoding: true, canonical: true, exonCount: 1, codingSequenceLength: sequence.length,
      exons: [{ id: `${seed.symbol}-CDS`, number: 1, genomicStart: 0, genomicEnd: sequence.length - 1, codingStatus: 'coding', transcriptIds: ids, proteinStart: 1, proteinEnd: 60, constitutive: true }],
    }]
  }
  if (!seed.alternativeTranscripts) {
    return [{
      id: ids[0], geneId: seed.id, organismId: seed.organismId, assemblyId: seed.assembly,
      proteinCoding: true, canonical: true, exonCount: 1, codingSequenceLength: sequence.length,
      exons: [{ id: `${seed.symbol}-E1`, number: 1, genomicStart: 0, genomicEnd: sequence.length - 1, codingStatus: 'coding', transcriptIds: ids, proteinStart: 1, proteinEnd: 60, constitutive: true }],
    }]
  }
  return [
    {
      id: ids[0], geneId: seed.id, organismId: seed.organismId, assemblyId: seed.assembly,
      proteinCoding: true, canonical: true, exonCount: 3, codingSequenceLength: 447,
      exons: [
        { id: `${seed.symbol}-E1`, number: 1, genomicStart: 0, genomicEnd: 49, codingStatus: 'coding', transcriptIds: ids, proteinStart: 1, proteinEnd: 45, constitutive: true },
        { id: `${seed.symbol}-E2`, number: 2, genomicStart: 70, genomicEnd: 129, codingStatus: 'coding', transcriptIds: ids, proteinStart: 46, proteinEnd: 105, constitutive: true },
        { id: `${seed.symbol}-E3`, number: 3, genomicStart: 150, genomicEnd: sequence.length - 1, codingStatus: 'coding', transcriptIds: [ids[0]], proteinStart: 106, proteinEnd: 149, constitutive: false },
      ],
    },
    {
      id: ids[1], geneId: seed.id, organismId: seed.organismId, assemblyId: seed.assembly,
      proteinCoding: true, canonical: false, exonCount: 2, codingSequenceLength: 315,
      exons: [
        { id: `${seed.symbol}-E1`, number: 1, genomicStart: 0, genomicEnd: 49, codingStatus: 'coding', transcriptIds: ids, proteinStart: 1, proteinEnd: 45, constitutive: true },
        { id: `${seed.symbol}-E2`, number: 2, genomicStart: 70, genomicEnd: 129, codingStatus: 'coding', transcriptIds: ids, proteinStart: 46, proteinEnd: 105, constitutive: true },
      ],
    },
  ]
}

export const transcripts: Transcript[] = geneSeeds.flatMap(makeTranscripts)

export const genes: Gene[] = geneSeeds.map((seed, index) => ({
  id: seed.id,
  organismId: seed.organismId,
  symbol: seed.symbol,
  name: seed.name,
  chromosome: seed.chromosome,
  genomicStart: seed.genomicStart,
  genomicEnd: seed.genomicStart + sequence.length - 1,
  strand: index % 2 === 0 ? '+' : '-',
  assembly: seed.assembly,
  genomeOrganization: organisms.find((item) => item.id === seed.organismId)?.genomeOrganization ?? 'eukaryotic',
  transcriptIds: transcriptIdsFor(seed),
  sequence: `${sequence.slice((index * 17) % sequence.length)}${sequence.slice(0, (index * 17) % sequence.length)}`,
  transcriptionStartSite: seed.genomicStart,
  domains: [{ id: `${seed.symbol}-D1`, name: `${seed.symbol} functional region`, proteinStart: 20, proteinEnd: 50, source: 'demonstration' }],
}))

export function getGenesForAssembly(organismId: string, assemblyId: string): Gene[] {
  return genes.filter((item) => item.organismId === organismId && item.assembly === assemblyId)
}

export function getGeneTranscripts(geneId: string): Transcript[] {
  return transcripts.filter((item) => item.geneId === geneId)
}

export const demonstrationGenomeProvider: GenomeDataProvider = {
  id: 'guidewise-demonstration-genomes',
  provenance: 'demonstration',
  async getOrganisms() { return organisms },
  async getGenes({ organismId, assemblyId }) { return getGenesForAssembly(organismId, assemblyId) },
  async getTranscripts({ organismId, assemblyId, geneId }) {
    return transcripts.filter((item) => item.organismId === organismId && item.assemblyId === assemblyId && item.geneId === geneId)
  },
  async getSequence({ organismId, assemblyId, geneId }) {
    return genes.find((item) => item.organismId === organismId && item.assembly === assemblyId && item.id === geneId)?.sequence ?? ''
  },
}

export const mockDataDisclosure =
  'Demonstration mode: organism assemblies, sequences, annotations, activity scores, and off-target results may be simulated.'
