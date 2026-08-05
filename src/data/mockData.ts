import type {
  Gene,
  ExampleGeneCategory,
  GenomeDataProvider,
  GeneProvider,
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
  synthetic: 'Synthetic constructs',
}

export const organismCategoryOrder: OrganismCategory[] = ['mammals', 'fish', 'insects', 'nematodes', 'plants', 'fungi', 'bacteria', 'synthetic']

export const organisms: Organism[] = [
  {
    id: 'human', ncbiTaxonId: '9606', scientificName: 'Homo sapiens', commonName: 'Human', category: 'mammals', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [
      { id: 'GRCh38', label: 'GRCh38.p14', accession: 'GCA_000001405.29', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' },
      { id: 'GRCh37', label: 'GRCh37.p13', accession: 'GCA_000001405.14', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' },
    ],
  },
  {
    id: 'mouse', ncbiTaxonId: '10090', scientificName: 'Mus musculus', commonName: 'Mouse', category: 'mammals', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'GRCm39', label: 'GRCm39', accession: 'GCA_000001635.9', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' }],
  },
  {
    id: 'rat', ncbiTaxonId: '10116', scientificName: 'Rattus norvegicus', commonName: 'Rat', category: 'mammals', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'mRatBN7.2', label: 'mRatBN7.2', accession: 'GCA_015227675.2', source: 'Ensembl reference assembly', provenance: 'demonstration' }],
  },
  {
    id: 'zebrafish', ncbiTaxonId: '7955', scientificName: 'Danio rerio', commonName: 'Zebrafish', category: 'fish', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'GRCz11', label: 'GRCz11', accession: 'GCA_000002035.4', source: 'Genome Reference Consortium / Ensembl', provenance: 'demonstration' }],
  },
  {
    id: 'fruit-fly', ncbiTaxonId: '7227', scientificName: 'Drosophila melanogaster', commonName: 'Fruit fly', category: 'insects', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'BDGP6.46', label: 'BDGP6.46', source: 'FlyBase / Ensembl Metazoa', provenance: 'demonstration' }],
  },
  {
    id: 'c-elegans', ncbiTaxonId: '6239', scientificName: 'Caenorhabditis elegans', commonName: 'C. elegans', category: 'nematodes', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'WBcel235', label: 'WBcel235', accession: 'GCA_000002985.3', source: 'WormBase / Ensembl Metazoa', provenance: 'demonstration' }],
  },
  {
    id: 'arabidopsis', ncbiTaxonId: '3702', scientificName: 'Arabidopsis thaliana', commonName: 'Arabidopsis', category: 'plants', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: true,
    annotationNote: 'Transcript, exon, and isoform-aware analysis is enabled.',
    assemblies: [{ id: 'TAIR10', label: 'TAIR10', accession: 'GCA_000001735.1', source: 'TAIR / Ensembl Plants', provenance: 'demonstration' }],
  },
  {
    id: 'yeast', ncbiTaxonId: '4932', scientificName: 'Saccharomyces cerevisiae', commonName: 'Budding yeast', category: 'fungi', genomeOrganization: 'eukaryotic',
    supportsTranscriptAnalysis: true, supportsAlternativeSplicing: false,
    annotationNote: 'Exon analysis is available; extensive alternative-splicing logic is de-emphasized for this demonstration.',
    assemblies: [{ id: 'R64-1-1', label: 'R64-1-1', accession: 'GCA_000146045.2', source: 'Saccharomyces Genome Database / Ensembl Fungi', provenance: 'demonstration' }],
  },
  {
    id: 'e-coli', ncbiTaxonId: '511145', scientificName: 'Escherichia coli', commonName: 'E. coli K-12 MG1655', category: 'bacteria', genomeOrganization: 'prokaryotic',
    supportsTranscriptAnalysis: false, supportsAlternativeSplicing: false,
    annotationNote: 'Prokaryotic mode uses gene/CDS features and does not apply eukaryotic exon or alternative-transcript coverage logic.',
    assemblies: [{ id: 'ASM584v2', label: 'ASM584v2', accession: 'GCF_000005845.2', source: 'NCBI RefSeq', provenance: 'demonstration' }],
  },
  {
    id: 'reporters', scientificName: 'Synthetic reporter constructs', commonName: 'Educational reporters', category: 'synthetic', genomeOrganization: 'prokaryotic',
    supportsTranscriptAnalysis: false, supportsAlternativeSplicing: false,
    annotationNote: 'Synthetic intronless reporter mode; these records are not mapped to a natural organism assembly.',
    assemblies: [{ id: 'Reporter-v1', label: 'Reporter constructs v1', source: 'GuideWise demonstration', provenance: 'demonstration' }],
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
  sequenceAccession?: string
  genomicStart: number
  alternativeTranscripts: boolean
  ensemblGeneId?: string
  ncbiGeneId?: string
  refSeqIds?: string[]
  geneType?: string
  exampleCategory?: ExampleGeneCategory
}

const geneSeeds: GeneSeed[] = [
  { id: 'hbb', organismId: 'human', assembly: 'GRCh38', symbol: 'HBB', name: 'Hemoglobin subunit beta', chromosome: '11', sequenceAccession: 'NC_000011.10', genomicStart: 5_225_464, alternativeTranscripts: true },
  { id: 'brca1', organismId: 'human', assembly: 'GRCh38', symbol: 'BRCA1', name: 'BRCA1 DNA repair associated', chromosome: '17', sequenceAccession: 'NC_000017.11', genomicStart: 43_044_295, alternativeTranscripts: true },
  { id: 'cftr', organismId: 'human', assembly: 'GRCh38', symbol: 'CFTR', name: 'CF transmembrane conductance regulator', chromosome: '7', sequenceAccession: 'NC_000007.14', genomicStart: 117_480_025, alternativeTranscripts: true },
  { id: 'pcsk9', organismId: 'human', assembly: 'GRCh38', symbol: 'PCSK9', name: 'Proprotein convertase subtilisin/kexin type 9', chromosome: '1', sequenceAccession: 'NC_000001.11', genomicStart: 55_505_221, alternativeTranscripts: true },
  { id: 'tp53', organismId: 'human', assembly: 'GRCh38', symbol: 'TP53', name: 'Tumor protein p53', chromosome: '17', sequenceAccession: 'NC_000017.11', genomicStart: 7_668_401, alternativeTranscripts: true },
  { id: 'hbb-grch37', organismId: 'human', assembly: 'GRCh37', symbol: 'HBB', name: 'Hemoglobin subunit beta', chromosome: '11', sequenceAccession: 'NC_000011.9', genomicStart: 5_246_696, alternativeTranscripts: true },
  { id: 'brca1-grch37', organismId: 'human', assembly: 'GRCh37', symbol: 'BRCA1', name: 'BRCA1 DNA repair associated', chromosome: '17', sequenceAccession: 'NC_000017.10', genomicStart: 41_196_312, alternativeTranscripts: true },
  { id: 'mouse-trp53', organismId: 'mouse', assembly: 'GRCm39', symbol: 'Trp53', name: 'Transformation related protein 53', chromosome: '11', sequenceAccession: 'NC_000077.7', genomicStart: 69_569_000, alternativeTranscripts: true },
  { id: 'rat-tp53', organismId: 'rat', assembly: 'mRatBN7.2', symbol: 'Tp53', name: 'Tumor protein p53', chromosome: '10', genomicStart: 56_000_000, alternativeTranscripts: true },
  { id: 'zfish-tp53', organismId: 'zebrafish', assembly: 'GRCz11', symbol: 'tp53', name: 'Tumor protein p53', chromosome: '5', genomicStart: 35_000_000, alternativeTranscripts: true },
  { id: 'fly-white', organismId: 'fruit-fly', assembly: 'BDGP6.46', symbol: 'white', name: 'white', chromosome: 'X', genomicStart: 2_790_000, alternativeTranscripts: true },
  { id: 'worm-unc54', organismId: 'c-elegans', assembly: 'WBcel235', symbol: 'unc-54', name: 'Myosin class II heavy chain', chromosome: 'I', genomicStart: 14_800_000, alternativeTranscripts: true },
  { id: 'arabidopsis-pds3', organismId: 'arabidopsis', assembly: 'TAIR10', symbol: 'PDS3', name: 'Phytoene desaturation 3', chromosome: '4', genomicStart: 8_200_000, alternativeTranscripts: true },
  { id: 'yeast-ade2', organismId: 'yeast', assembly: 'R64-1-1', symbol: 'ADE2', name: 'Phosphoribosylaminoimidazole carboxylase', chromosome: 'XV', genomicStart: 560_000, alternativeTranscripts: false },
  { id: 'ecoli-lacz', organismId: 'e-coli', assembly: 'ASM584v2', symbol: 'lacZ', name: 'Beta-galactosidase', chromosome: 'chromosome', sequenceAccession: 'NC_000913.3', genomicStart: 360_000, alternativeTranscripts: false },
  { id: 'hba1', organismId: 'human', assembly: 'GRCh38', symbol: 'HBA1', name: 'Hemoglobin subunit alpha 1', chromosome: '16', genomicStart: 10_000_100, alternativeTranscripts: true },
  { id: 'hba2', organismId: 'human', assembly: 'GRCh38', symbol: 'HBA2', name: 'Hemoglobin subunit alpha 2', chromosome: '16', genomicStart: 10_001_100, alternativeTranscripts: true },
  { id: 'bcl11a', organismId: 'human', assembly: 'GRCh38', symbol: 'BCL11A', name: 'BAF chromatin remodeling complex subunit BCL11A', chromosome: '2', genomicStart: 10_002_100, alternativeTranscripts: true },
  { id: 'f8', organismId: 'human', assembly: 'GRCh38', symbol: 'F8', name: 'Coagulation factor VIII', chromosome: 'X', genomicStart: 10_003_100, alternativeTranscripts: true },
  { id: 'f9', organismId: 'human', assembly: 'GRCh38', symbol: 'F9', name: 'Coagulation factor IX', chromosome: 'X', genomicStart: 10_004_100, alternativeTranscripts: true },
  { id: 'brca2', organismId: 'human', assembly: 'GRCh38', symbol: 'BRCA2', name: 'BRCA2 DNA repair associated', chromosome: '13', genomicStart: 10_005_100, alternativeTranscripts: true },
  { id: 'kras', organismId: 'human', assembly: 'GRCh38', symbol: 'KRAS', name: 'KRAS proto-oncogene, GTPase', chromosome: '12', genomicStart: 10_006_100, alternativeTranscripts: true },
  { id: 'egfr', organismId: 'human', assembly: 'GRCh38', symbol: 'EGFR', name: 'Epidermal growth factor receptor', chromosome: '7', genomicStart: 10_007_100, alternativeTranscripts: true },
  { id: 'myc', organismId: 'human', assembly: 'GRCh38', symbol: 'MYC', name: 'MYC proto-oncogene, bHLH transcription factor', chromosome: '8', genomicStart: 10_008_100, alternativeTranscripts: true },
  { id: 'pten', organismId: 'human', assembly: 'GRCh38', symbol: 'PTEN', name: 'Phosphatase and tensin homolog', chromosome: '10', genomicStart: 10_009_100, alternativeTranscripts: true },
  { id: 'ldlr', organismId: 'human', assembly: 'GRCh38', symbol: 'LDLR', name: 'Low density lipoprotein receptor', chromosome: '19', genomicStart: 10_010_100, alternativeTranscripts: true },
  { id: 'apob', organismId: 'human', assembly: 'GRCh38', symbol: 'APOB', name: 'Apolipoprotein B', chromosome: '2', genomicStart: 10_011_100, alternativeTranscripts: true },
  { id: 'lpa', organismId: 'human', assembly: 'GRCh38', symbol: 'LPA', name: 'Lipoprotein(a)', chromosome: '6', genomicStart: 10_012_100, alternativeTranscripts: true },
  { id: 'angptl3', organismId: 'human', assembly: 'GRCh38', symbol: 'ANGPTL3', name: 'Angiopoietin like 3', chromosome: '1', genomicStart: 10_013_100, alternativeTranscripts: true },
  { id: 'htt', organismId: 'human', assembly: 'GRCh38', symbol: 'HTT', name: 'Huntingtin', chromosome: '4', genomicStart: 10_014_100, alternativeTranscripts: true },
  { id: 'snca', organismId: 'human', assembly: 'GRCh38', symbol: 'SNCA', name: 'Synuclein alpha', chromosome: '4', genomicStart: 10_015_100, alternativeTranscripts: true },
  { id: 'app', organismId: 'human', assembly: 'GRCh38', symbol: 'APP', name: 'Amyloid beta precursor protein', chromosome: '21', genomicStart: 10_016_100, alternativeTranscripts: true },
  { id: 'psen1', organismId: 'human', assembly: 'GRCh38', symbol: 'PSEN1', name: 'Presenilin 1', chromosome: '14', genomicStart: 10_017_100, alternativeTranscripts: true },
  { id: 'sod1', organismId: 'human', assembly: 'GRCh38', symbol: 'SOD1', name: 'Superoxide dismutase 1', chromosome: '21', genomicStart: 10_018_100, alternativeTranscripts: true },
  { id: 'mecp2', organismId: 'human', assembly: 'GRCh38', symbol: 'MECP2', name: 'Methyl-CpG binding protein 2', chromosome: 'X', genomicStart: 10_019_100, alternativeTranscripts: true },
  { id: 'dmd', organismId: 'human', assembly: 'GRCh38', symbol: 'DMD', name: 'Dystrophin', chromosome: 'X', genomicStart: 10_020_100, alternativeTranscripts: true },
  { id: 'smn1', organismId: 'human', assembly: 'GRCh38', symbol: 'SMN1', name: 'Survival of motor neuron 1', chromosome: '5', genomicStart: 10_021_100, alternativeTranscripts: true },
  { id: 'smn2', organismId: 'human', assembly: 'GRCh38', symbol: 'SMN2', name: 'Survival of motor neuron 2', chromosome: '5', genomicStart: 10_022_100, alternativeTranscripts: true },
  { id: 'myh7', organismId: 'human', assembly: 'GRCh38', symbol: 'MYH7', name: 'Myosin heavy chain 7', chromosome: '14', genomicStart: 10_023_100, alternativeTranscripts: true },
  { id: 'pah', organismId: 'human', assembly: 'GRCh38', symbol: 'PAH', name: 'Phenylalanine hydroxylase', chromosome: '12', genomicStart: 10_024_100, alternativeTranscripts: true },
  { id: 'ttr', organismId: 'human', assembly: 'GRCh38', symbol: 'TTR', name: 'Transthyretin', chromosome: '18', genomicStart: 10_025_100, alternativeTranscripts: true },
  { id: 'g6pc', organismId: 'human', assembly: 'GRCh38', symbol: 'G6PC', name: 'Glucose-6-phosphatase catalytic subunit 1', chromosome: '17', genomicStart: 10_026_100, alternativeTranscripts: true },
  { id: 'otc', organismId: 'human', assembly: 'GRCh38', symbol: 'OTC', name: 'Ornithine transcarbamylase', chromosome: 'X', genomicStart: 10_027_100, alternativeTranscripts: true },
  { id: 'serpina1', organismId: 'human', assembly: 'GRCh38', symbol: 'SERPINA1', name: 'Serpin family A member 1', chromosome: '14', genomicStart: 10_028_100, alternativeTranscripts: true },
  { id: 'ccr5', organismId: 'human', assembly: 'GRCh38', symbol: 'CCR5', name: 'C-C motif chemokine receptor 5', chromosome: '3', genomicStart: 10_029_100, alternativeTranscripts: true },
  { id: 'il2rg', organismId: 'human', assembly: 'GRCh38', symbol: 'IL2RG', name: 'Interleukin 2 receptor subunit gamma', chromosome: 'X', genomicStart: 10_030_100, alternativeTranscripts: true },
  { id: 'cd19', organismId: 'human', assembly: 'GRCh38', symbol: 'CD19', name: 'CD19 molecule', chromosome: '16', genomicStart: 10_031_100, alternativeTranscripts: true },
  { id: 'pdcd1', organismId: 'human', assembly: 'GRCh38', symbol: 'PDCD1', name: 'Programmed cell death 1', chromosome: '2', genomicStart: 10_032_100, alternativeTranscripts: true },
  { id: 'rpe65', organismId: 'human', assembly: 'GRCh38', symbol: 'RPE65', name: 'Retinoid isomerohydrolase RPE65', chromosome: '1', genomicStart: 10_033_100, alternativeTranscripts: true },
  { id: 'cep290', organismId: 'human', assembly: 'GRCh38', symbol: 'CEP290', name: 'Centrosomal protein 290', chromosome: '12', genomicStart: 10_034_100, alternativeTranscripts: true },
  { id: 'ush2a', organismId: 'human', assembly: 'GRCh38', symbol: 'USH2A', name: 'Usherin', chromosome: '1', genomicStart: 10_035_100, alternativeTranscripts: true },
  { id: 'actb', organismId: 'human', assembly: 'GRCh38', symbol: 'ACTB', name: 'Actin beta', chromosome: '7', genomicStart: 10_036_100, alternativeTranscripts: true },
  { id: 'gapdh', organismId: 'human', assembly: 'GRCh38', symbol: 'GAPDH', name: 'Glyceraldehyde-3-phosphate dehydrogenase', chromosome: '12', genomicStart: 10_037_100, alternativeTranscripts: true },
  { id: 'reporter-gfp', organismId: 'reporters', assembly: 'Reporter-v1', symbol: 'GFP', name: 'Green fluorescent protein reporter', chromosome: 'GFP_construct', genomicStart: 1, alternativeTranscripts: false, geneType: 'synthetic reporter', exampleCategory: 'basic_research' },
  { id: 'reporter-lacz', organismId: 'reporters', assembly: 'Reporter-v1', symbol: 'lacZ', name: 'Beta-galactosidase reporter', chromosome: 'lacZ_construct', genomicStart: 1, alternativeTranscripts: false, geneType: 'synthetic reporter', exampleCategory: 'basic_research' },
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

const exampleCategories: Record<ExampleGeneCategory, string[]> = {
  blood_disorders: ['HBB', 'HBA1', 'HBA2', 'BCL11A', 'F8', 'F9'],
  cancer: ['TP53', 'BRCA1', 'BRCA2', 'KRAS', 'EGFR', 'MYC', 'PTEN'],
  cardiovascular: ['PCSK9', 'LDLR', 'APOB', 'LPA', 'ANGPTL3'],
  neurological: ['HTT', 'SNCA', 'APP', 'PSEN1', 'SOD1', 'MECP2'],
  muscle_disorders: ['DMD', 'SMN1', 'SMN2', 'MYH7'],
  metabolic_liver: ['PAH', 'TTR', 'G6PC', 'OTC'],
  lung_epithelial: ['CFTR', 'SERPINA1'],
  immune_system: ['CCR5', 'IL2RG', 'CD19', 'PDCD1'],
  vision: ['RPE65', 'CEP290', 'USH2A'],
  basic_research: ['GFP', 'lacZ', 'ACTB', 'GAPDH'],
}

export const exampleGeneCategoryLabels: Record<ExampleGeneCategory, string> = {
  blood_disorders: 'Blood disorders', cancer: 'Cancer', cardiovascular: 'Cardiovascular', neurological: 'Neurological',
  muscle_disorders: 'Muscle disorders', metabolic_liver: 'Metabolic and liver', lung_epithelial: 'Lung and epithelial disease',
  immune_system: 'Immune system', vision: 'Vision', basic_research: 'Basic research and education',
}

const identifierMetadata: Record<string, { ensemblGeneId?: string; ncbiGeneId?: string; refSeqIds?: string[] }> = {
  'human:HBB': { ensemblGeneId: 'ENSG00000244734', ncbiGeneId: '3043', refSeqIds: ['NM_000518.5'] },
  'human:BRCA1': { ensemblGeneId: 'ENSG00000012048', ncbiGeneId: '672', refSeqIds: ['NM_007294.4'] },
  'human:TP53': { ensemblGeneId: 'ENSG00000141510', ncbiGeneId: '7157', refSeqIds: ['NM_000546.6'] },
  'human:CFTR': { ensemblGeneId: 'ENSG00000001626', ncbiGeneId: '1080', refSeqIds: ['NM_000492.4'] },
  'human:PCSK9': { ensemblGeneId: 'ENSG00000169174', ncbiGeneId: '255738', refSeqIds: ['NM_174936.4'] },
  'e-coli:lacZ': { ncbiGeneId: '945006', refSeqIds: ['NC_000913.3'] },
}

function exampleCategoryFor(seed: GeneSeed): ExampleGeneCategory | undefined {
  if (seed.exampleCategory) return seed.exampleCategory
  if (seed.organismId !== 'human' || seed.assembly !== 'GRCh38') return seed.symbol === 'lacZ' ? 'basic_research' : undefined
  return (Object.entries(exampleCategories) as Array<[ExampleGeneCategory, string[]]>).find(([, symbols]) => symbols.includes(seed.symbol))?.[0]
}

export const genes: Gene[] = geneSeeds.map((seed, index) => ({
  id: seed.id,
  organismId: seed.organismId,
  symbol: seed.symbol,
  ...identifierMetadata[`${seed.organismId}:${seed.symbol}`],
  geneType: seed.geneType ?? 'protein-coding',
  exampleCategory: exampleCategoryFor(seed),
  name: seed.name,
  chromosome: seed.chromosome,
  sequenceAccession: seed.sequenceAccession,
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

export function resolveGeneRecords(organismId: string, assemblyId: string, query: string): Gene[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return []
  return getGenesForAssembly(organismId, assemblyId).filter((item) =>
    [item.symbol, item.name, item.ensemblGeneId, item.ncbiGeneId, ...(item.refSeqIds ?? [])]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(normalized)),
  )
}

export function getGeneTranscripts(geneId: string): Transcript[] {
  return transcripts.filter((item) => item.geneId === geneId)
}

export const demonstrationGenomeProvider: GenomeDataProvider = {
  id: 'guidewise-demonstration-genomes',
  provenance: 'demonstration',
  async getOrganisms() { return organisms },
  async getGenes({ organismId, assemblyId }) { return getGenesForAssembly(organismId, assemblyId) },
  async resolveGenes({ organismId, assemblyId, query }) { return resolveGeneRecords(organismId, assemblyId, query) },
  async getTranscripts({ organismId, assemblyId, geneId }) {
    return transcripts.filter((item) => item.organismId === organismId && item.assemblyId === assemblyId && item.geneId === geneId)
  },
  async getSequence({ organismId, assemblyId, geneId }) {
    return genes.find((item) => item.organismId === organismId && item.assembly === assemblyId && item.id === geneId)?.sequence ?? ''
  },
}

export const demonstrationGeneProvider: GeneProvider = {
  id: 'guidewise-demonstration-genes',
  provenance: 'demonstration',
  async searchGenes({ organismId, assemblyId, query, limit = 25 }: { organismId: string; assemblyId: string; query: string; limit?: number }) {
    return resolveGeneRecords(organismId, assemblyId, query).slice(0, limit)
  },
  async getGene({ organismId, assemblyId, geneId }: { organismId: string; assemblyId: string; geneId: string }) {
    return getGenesForAssembly(organismId, assemblyId).find((item) => item.id === geneId)
  },
  async getExampleGenes({ organismId, assemblyId }: { organismId: string; assemblyId: string }) {
    return getGenesForAssembly(organismId, assemblyId).filter((item) => item.exampleCategory)
  },
}

export const mockDataDisclosure =
  'Demonstration mode: organism assemblies, sequences, annotations, activity scores, and off-target results may be simulated.'
