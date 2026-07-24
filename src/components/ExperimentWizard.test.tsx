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
})
