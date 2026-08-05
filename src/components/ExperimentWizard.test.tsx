import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperimentWizard } from './ExperimentWizard'

const organismNames: Record<string, string> = {
  '9606': 'Homo sapiens',
  '10090': 'Mus musculus',
  '7955': 'Danio rerio',
  '511145': 'Escherichia coli str. K-12 substr. MG1655',
}

function geneResponse(symbol: string, taxonId: string, assembly: string) {
  return {
    ncbiGeneId: symbol === 'TP53' ? '7157' : '3043',
    symbol,
    name: symbol === 'BRCA1' ? 'BRCA1 DNA repair associated' : `${symbol} official NCBI name`,
    organism: { taxonId, scientificName: organismNames[taxonId] ?? 'Test organism', commonName: 'test' },
    geneType: 'PROTEIN_CODING',
    aliases: ['ALIAS1'],
    ensemblGeneIds: ['ENSG000001TEST'],
    location: {
      assemblyName: `${assembly}.current`, assemblyAccession: 'GCF_TEST', chromosome: symbol === 'BRCA1' ? '17' : '11',
      sequenceAccession: symbol === 'BRCA1' ? 'NC_000017.11' : 'NC_000011.10', start: 1000, end: 2000, strand: '-',
      coordinateSystem: 'NCBI Datasets gene report (unconverted)',
    },
    transcriptCount: 4,
    transcripts: null,
    summary: 'A sourced NCBI gene summary.',
    availability: { location: 'available', transcripts: 'not_in_gene_report', exons: 'not_in_gene_report' },
    source: { provider: 'NCBI Datasets', apiVersion: 'v2', endpoint: 'https://api.ncbi.test', retrievedAt: '2026-08-04T12:00:00.000Z', cached: false },
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input), 'http://localhost')
    const symbol = decodeURIComponent(url.pathname.split('/').at(-1) ?? '')
    if (symbol === 'NOT_A_GENE') return new Response(JSON.stringify({ error: 'Gene not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    if (symbol === 'API_FAIL') return new Response(JSON.stringify({ error: 'NCBI upstream unavailable.' }), { status: 502, headers: { 'Content-Type': 'application/json' } })
    const taxon = symbol === 'MISMATCH' ? '10090' : (url.searchParams.get('taxon') ?? '9606')
    return new Response(JSON.stringify(geneResponse(symbol, taxon, url.searchParams.get('assembly') ?? 'GRCh38')), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function openTargetStep() {
  fireEvent.click(screen.getByRole('button', { name: /continue/i }))
  await screen.findByText('NCBI gene verified')
}

async function chooseDemoTranscript() {
  fireEvent.change(screen.getByLabelText(/Demonstration transcript for guide preview/), { target: { value: 'ENST-HBB-001' } })
  await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled())
}

describe('ExperimentWizard', () => {
  it('uses a real NCBI lookup and still requires an explicit demonstration transcript', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    expect(screen.getByRole('heading', { name: 'Target summary' })).toBeInTheDocument()
    expect(screen.getByText('LIVE NCBI DATA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    await chooseDemoTranscript()
  })

  it('shows experiment-specific fields after verified lookup', async () => {
    render(<ExperimentWizard initialExperiment="knockin" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    await chooseDemoTranscript()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByLabelText(/Exact intended edit position/)).toBeInTheDocument()
  })

  it('updates educational nuclease guidance from experiment context and priority', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    await chooseDemoTranscript()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/What best describes your experiment/), { target: { value: 'stem_cells' } })
    fireEvent.change(screen.getByLabelText(/What is your main priority/), { target: { value: 'minimize_off_targets' } })
    expect(screen.getByRole('heading', { name: /Consider Sniper-Cas9 or another validated high-fidelity Cas9/i })).toBeInTheDocument()
  })

  it('uses organism taxonomy and assembly in the request', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.change(screen.getByLabelText(/^Organism/), { target: { value: 'zebrafish' } })
    await screen.findByText('NCBI gene verified')
    expect(screen.getByLabelText(/Reference genome assembly/)).toHaveValue('GRCz11')
    expect(screen.getByLabelText(/NCBI gene symbol/)).toHaveValue('tp53')
    expect(fetch).toHaveBeenLastCalledWith('/api/genes/tp53?taxon=7955&assembly=GRCz11', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('uses prokaryotic mode without a transcript selector', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.change(screen.getByLabelText(/^Organism/), { target: { value: 'e-coli' } })
    await screen.findByText('NCBI gene verified')
    expect(screen.queryByLabelText(/Demonstration transcript/)).not.toBeInTheDocument()
    expect(screen.getByText('Prokaryotic gene-feature mode')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('displays real NCBI coordinates instead of demonstration metadata', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.change(screen.getByLabelText(/NCBI gene symbol/), { target: { value: 'BRCA1' } })
    await screen.findByText('BRCA1 DNA repair associated')
    expect(screen.getByText(/NC_000017.11:1,000–2,000/)).toBeInTheDocument()
    expect(screen.queryByText('DEMONSTRATION GENE ANNOTATION')).not.toBeInTheDocument()
  })

  it('shows loading then not-found without silently falling back', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.change(screen.getByLabelText(/NCBI gene symbol/), { target: { value: 'NOT_A_GENE' } })
    expect(screen.getByText('Searching NCBI…')).toBeInTheDocument()
    expect(await screen.findByText('Gene not found')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Target summary' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('shows an API error without mock fallback', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.change(screen.getByLabelText(/NCBI gene symbol/), { target: { value: 'API_FAIL' } })
    expect(await screen.findByText('NCBI lookup unavailable')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/will not be substituted/i)
    expect(screen.queryByRole('heading', { name: 'Target summary' })).not.toBeInTheDocument()
  })

  it('rejects an organism-mismatched response', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.change(screen.getByLabelText(/NCBI gene symbol/), { target: { value: 'MISMATCH' } })
    expect(await screen.findByText('Organism mismatch')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Target summary' })).not.toBeInTheDocument()
  })

  it('offers grouped demonstration shortcuts that trigger a new lookup', async () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    await openTargetStep()
    fireEvent.click(screen.getByText('Browse educational example genes'))
    expect(screen.getByText('Blood disorders')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'BRCA2' }))
    expect(screen.getByLabelText(/NCBI gene symbol/)).toHaveValue('BRCA2')
    await screen.findByText('NCBI gene verified')
  })

  it('requires region coordinates and does not invent raw-sequence annotations', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/Target input mode/), { target: { value: 'genomic_region' } })
    expect(screen.getByText('Enter a chromosome or sequence identifier.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Target input mode/), { target: { value: 'raw_sequence' } })
    fireEvent.change(screen.getByLabelText(/Raw DNA sequence/), { target: { value: 'ATGCTGACCTGACTGACTGATGG' } })
    expect(screen.getByText(/candidate SpCas9 guide/)).toBeInTheDocument()
    expect(screen.getByText(/cannot invent chromosome location/)).toBeInTheDocument()
  })
})
