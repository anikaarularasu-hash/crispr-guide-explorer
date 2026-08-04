import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExperimentWizard } from './ExperimentWizard'

afterEach(cleanup)

describe('ExperimentWizard', () => {
  it('navigates through setup and requires an explicit transcript', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    expect(screen.getByText('What is the goal of this experiment?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByText('Select the biological target')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Transcript/), { target: { value: 'ENST-HBB-001' } })
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('shows experiment-specific fields', () => {
    render(<ExperimentWizard initialExperiment="knockin" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/Transcript/), { target: { value: 'ENST-HBB-001' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByLabelText(/Exact intended edit position/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Reference allele/)).toBeInTheDocument()
  })

  it('updates educational nuclease guidance from experiment context and priority', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/Transcript/), { target: { value: 'ENST-HBB-001' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/What best describes your experiment/), { target: { value: 'stem_cells' } })
    fireEvent.change(screen.getByLabelText(/What is your main priority/), { target: { value: 'minimize_off_targets' } })
    expect(screen.getByRole('heading', { name: /Consider Sniper-Cas9 or another validated high-fidelity Cas9/i })).toBeInTheDocument()
    expect(screen.getByText(/Educational decision support/i)).toBeInTheDocument()
    expect(screen.getByText(/not guide-specific off-target evidence/i)).toBeInTheDocument()
  })

  it('loads the assembly and annotations for a selected organism', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/^Organism/), { target: { value: 'zebrafish' } })
    expect(screen.getByLabelText(/Reference genome assembly/)).toHaveValue('GRCz11')
    expect(screen.getByLabelText(/Gene symbol or name/)).toHaveValue('tp53')
    expect(screen.getByText(/chromosome sequence/i).parentElement).toHaveTextContent('5 region loaded')
    expect(screen.getByLabelText(/Transcript/)).toHaveValue('')
  })

  it('uses prokaryotic mode without requiring transcript selection', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/^Organism/), { target: { value: 'e-coli' } })
    expect(screen.getByLabelText(/Reference genome assembly/)).toHaveValue('ASM584v2')
    expect(screen.queryByLabelText(/Transcript/)).not.toBeInTheDocument()
    expect(screen.getByText('Prokaryotic gene-feature mode')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('automatically displays chromosome context without a chromosome input in gene mode', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/Gene symbol or name/), { target: { value: 'BRCA1' } })
    expect(screen.getByRole('heading', { name: 'Target summary' })).toBeInTheDocument()
    expect(screen.getByText(/NC_000017.11/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Chromosome$/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /about chromosome/i })).toHaveAttribute('title', expect.stringContaining('determines the chromosome automatically'))
  })

  it('shows a clear error for an unknown gene', () => {
    render(<ExperimentWizard initialExperiment="knockout" onCancel={vi.fn()} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByLabelText(/Gene symbol or name/), { target: { value: 'NOT_A_GENE' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/No gene named/)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
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
