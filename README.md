# GuideWise

GuideWise is an experiment-aware CRISPR guide RNA design and education prototype. It helps scientists compare candidate guides in the context of a gene knockout, precise knock-in using homology-directed repair (HDR), CRISPR activation (CRISPRa), or CRISPR interference (CRISPRi).

> GuideWise is currently a demonstration and educational prototype. Its sequences, annotations, activity scores, specificity scores, and off-target records may be simulated. It is not research-grade, diagnostic, clinical, or safety software.

## Why experiment-aware ranking matters

There is no universally perfect guide RNA. A candidate that suits a knockout because it targets a shared coding exon may be inappropriate for a knock-in when its cut lies far from the intended edit. CRISPRa and CRISPRi depend on configurable transcription-start-site windows rather than protein-coding exon disruption. GuideWise therefore uses separate, transparent ranking functions for each experiment.

## Technology

- React 18
- TypeScript
- Vite
- Accessible HTML and SVG
- CSS with responsive desktop, tablet, and mobile layouts
- Vitest and Testing Library

The existing stack is preserved. Tailwind was not added because the project already had a working CSS architecture and did not require another runtime dependency.

## Run locally

Requirements: Node.js 20 or later and npm.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Run tests and the production build:

```bash
npm test
npm run build
```

## Architecture

```text
src/
  biology/        Pure DNA, guide generation, warnings, scoring, and explanations
  components/     Wizard, results workspace, comparison, visualization, learning UI
  data/           Explicit demonstration genes, transcripts, sequences, and nucleases
  features/       CSV and JSON export support
  types/          Shared CRISPR domain and provider interfaces
  lib/            Preserved original forward-guide utility
```

React components present data and manage local interaction. They do not contain biological scoring rules. Pure TypeScript functions can be tested without rendering the interface. Provider interfaces define future boundaries for real sequences, transcripts, protein annotations, activity models, off-target searches, and variants.

## Guide-generation logic

GuideWise currently implements SpCas9 guide discovery for demonstration sequences:

1. Normalize DNA to uppercase A, C, G, and T.
2. Scan the supplied region for forward `NGG` motifs.
3. Scan the opposite orientation by finding forward-reference `CCN` motifs.
4. Extract a 20-base guide in standard 5′→3′ orientation.
5. Reverse-complement reverse-strand targets.
6. Calculate local and genomic coordinates.
7. Represent cleavage approximately three bases upstream of the PAM.
8. Deduplicate candidates by sequence, strand, and position.

SpCas9 cleavage products can vary; the displayed cut is an approximate conventional representation.

## GC-content interpretation

GC content is `(G + C bases) / guide length × 100`. A common initial range is roughly 40–60%, but GuideWise does not automatically reject every candidate outside it. GC content is a warning/filter feature because activity also depends on base order, PAM-proximal sequence, RNA structure, chromatin, delivery, cell type, and nuclease context.

## Transcript coverage and exon suitability

Transcript coverage is the percentage of selected relevant transcripts containing the targeted region. The mock provider distinguishes canonical and alternative protein-coding transcripts and marks exons as constitutive or alternative. A shared coding exon may suit a broad knockout; a lower-coverage exon may be intentional for isoform-specific work. The first or last exon is not automatically preferred.

## Experiment-specific scoring

All current scores use **GuideWise sequence heuristic v0.2.0**. They are deterministic, configurable, and explicitly labeled as unvalidated heuristics—not editing percentages.

Suggested starting weights:

- **Knockout:** activity 25%, specificity 25%, transcript coverage 20%, exon/location suitability 15%, functional disruption 15%.
- **Knock-in:** cut-to-edit distance 35%, specificity 25%, activity 20%, recutting avoidance 10%, donor compatibility 10%.
- **CRISPRa:** TSS location 40%, specificity 25%, activity 20%, transcript/TSS confidence 15%.
- **CRISPRi:** TSS location 40%, specificity 25%, activity 20%, transcript/TSS confidence 15%.

Users can adjust weights. Warning penalties are applied separately. The UI explains that a different experimental goal or weight set may produce a different ranking.

## Activity and specificity limitations

Activity is a rule-based sequence heuristic incorporating GC suitability, PAM-proximal GC count, and homopolymer penalties. It is not a Doench model, has no training dataset, and does not estimate an exact probability or percentage of editing.

Specificity is a sequence-complexity heuristic. The prototype does **not** search a genome and cannot establish genomic uniqueness or off-target safety. Simulated off-target records exist only to demonstrate the future data model and UI.

## Warnings and explanations

Structured warnings contain a type, severity, explanation, evidence, suggested interpretation, and whether they change ranking. Deterministic explanation functions report a major strength, a major weakness, experiment context, and uncertainty. They do not use an LLM and do not claim certainty.

## Export

Results can be exported as CSV or JSON with setup metadata, guide sequence/PAM/strand, coordinates, cut position, scores, model name, off-target counts, warnings, explanation, software version, and mock-data status. CSV values are escaped for commas, quotes, and line breaks.

## Scientific limitations

- All current genes, transcript structures, protein domains, sequences, expression context, and off-targets are demonstration data.
- Coordinates are internally consistent within each demonstration record but do not represent a real genome lookup.
- There is no genome-wide alignment or bulge-aware off-target search.
- There is no validated on-target or off-target prediction model.
- There is no chromatin-accessibility, cell-type, delivery, repair-outcome, population-variation, disease-variant, or experimental measurement integration.
- A high score does not mean a guide will work, is safe, or is clinically approved.
- An indel does not guarantee a knockout, HDR does not guarantee a knock-in, and CRISPRa/i outcomes are context-dependent.

## Future integrations

Provider interfaces are ready for Ensembl/NCBI sequences and transcripts, UniProt domains, ClinVar/gnomAD variants, validated activity models, and real off-target tools such as Cas-OFFinder or aligner-backed searches. Real integration work must preserve genome assembly, transcript coordinate system, model version, and provenance.

## Contributing

1. Keep biological rules outside React components.
2. Add tests for every coordinate, strand, score, warning, or export change.
3. Label simulated and heuristic values visibly.
4. Document model name, version, inputs, scale, applicability, and limitations.
5. Never describe predictions as certainty or silently choose biological context.
6. Run `npm test` and `npm run build` before submitting a change.
