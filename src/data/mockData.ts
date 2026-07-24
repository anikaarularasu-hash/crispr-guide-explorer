import type { Gene, Nuclease, Organism, Transcript } from '../types/crispr'

export const organisms: Organism[] = [
  { id: 'human', scientificName: 'Homo sapiens', commonName: 'Human', assemblies: [{ id: 'GRCh38', label: 'GRCh38' }] },
  { id: 'mouse', scientificName: 'Mus musculus', commonName: 'Mouse', assemblies: [{ id: 'GRCm39', label: 'GRCm39' }] },
]

export const nucleases: Nuclease[] = [
  { id: 'spcas9', name: 'SpCas9', fullName: 'Streptococcus pyogenes Cas9', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'spcas9-hf1', name: 'SpCas9-HF1', fullName: 'SpCas9 high-fidelity variant 1', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'espcas9', name: 'eSpCas9', fullName: 'Enhanced-specificity SpCas9', pam: { pattern: 'NGG', guideLength: 20, pamLength: 3, cutOffsetFromPam: 3 }, catalyticallyActive: true },
  { id: 'sacas9', name: 'SaCas9', fullName: 'Staphylococcus aureus Cas9', pam: { pattern: 'NNGRRT', guideLength: 21, pamLength: 6, cutOffsetFromPam: 3 }, catalyticallyActive: true },
]

const sequence = [
  'ATGCTGACCTGACTGACTGATGG',
  'GCTAACGTCGATCGGATCCACGG',
  'CCAGTTACGATGCCATGATCTGG',
  'CCATGATCGTAGCTAACGTCCAA',
  'TGGACCGTATCGGCTAATGCTGG',
  'AATCGGCCATGCTAGCTAACCGG',
  'TTAGCGATCGTACCATGGCTAGG',
  'CCAGATCGATGCTAACCGTAGCA',
].join('')

function makeTranscripts(symbol: string): Transcript[] {
  const geneId = symbol.toLowerCase()
  return [
    {
      id: `ENST-${symbol}-001`,
      geneId,
      proteinCoding: true,
      canonical: true,
      exonCount: 3,
      codingSequenceLength: 447,
      exons: [
        { id: `${symbol}-E1`, number: 1, genomicStart: 0, genomicEnd: 49, codingStatus: 'coding', transcriptIds: [`ENST-${symbol}-001`, `ENST-${symbol}-002`], proteinStart: 1, proteinEnd: 45, constitutive: true },
        { id: `${symbol}-E2`, number: 2, genomicStart: 70, genomicEnd: 129, codingStatus: 'coding', transcriptIds: [`ENST-${symbol}-001`, `ENST-${symbol}-002`], proteinStart: 46, proteinEnd: 105, constitutive: true },
        { id: `${symbol}-E3`, number: 3, genomicStart: 150, genomicEnd: sequence.length - 1, codingStatus: 'coding', transcriptIds: [`ENST-${symbol}-001`], proteinStart: 106, proteinEnd: 149, constitutive: false },
      ],
    },
    {
      id: `ENST-${symbol}-002`,
      geneId,
      proteinCoding: true,
      canonical: false,
      exonCount: 2,
      codingSequenceLength: 315,
      exons: [
        { id: `${symbol}-E1`, number: 1, genomicStart: 0, genomicEnd: 49, codingStatus: 'coding', transcriptIds: [`ENST-${symbol}-001`, `ENST-${symbol}-002`], proteinStart: 1, proteinEnd: 45, constitutive: true },
        { id: `${symbol}-E2`, number: 2, genomicStart: 70, genomicEnd: 129, codingStatus: 'coding', transcriptIds: [`ENST-${symbol}-001`, `ENST-${symbol}-002`], proteinStart: 46, proteinEnd: 105, constitutive: true },
      ],
    },
  ]
}

export const transcripts: Transcript[] = ['HBB', 'CFTR', 'PCSK9', 'TP53'].flatMap(makeTranscripts)

const geneDetails = {
  HBB: ['Hemoglobin subunit beta', '11', 5_225_464],
  CFTR: ['CF transmembrane conductance regulator', '7', 117_480_025],
  PCSK9: ['Proprotein convertase subtilisin/kexin type 9', '1', 55_505_221],
  TP53: ['Tumor protein p53', '17', 7_668_401],
} as const

export const genes: Gene[] = (Object.keys(geneDetails) as Array<keyof typeof geneDetails>).map((symbol, index) => {
  const [name, chromosome, genomicStart] = geneDetails[symbol]
  return {
    id: symbol.toLowerCase(),
    symbol,
    name,
    chromosome,
    genomicStart,
    genomicEnd: genomicStart + sequence.length - 1,
    strand: index % 2 === 0 ? '+' : '-',
    assembly: 'GRCh38',
    transcriptIds: transcripts.filter((item) => item.geneId === symbol.toLowerCase()).map((item) => item.id),
    sequence: index % 2 === 0 ? sequence : `${sequence.slice(23)}${sequence.slice(0, 23)}`,
    transcriptionStartSite: genomicStart,
    domains: [{ id: `${symbol}-D1`, name: `${symbol} functional region`, proteinStart: 35, proteinEnd: 90, source: 'demonstration' }],
  }
})

export function getGeneTranscripts(geneId: string): Transcript[] {
  return transcripts.filter((item) => item.geneId === geneId)
}

export const mockDataDisclosure =
  'Demonstration mode: sequences, annotations, activity scores, and off-target results may be simulated.'
