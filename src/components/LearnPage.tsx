const topics = [
  ['CRISPR, Cas9 & guide RNA', 'CRISPR systems use a guide RNA to direct a CRISPR-associated protein toward a complementary nucleic-acid sequence.', 'Cas9 is a nuclease family. SpCas9 is one member from Streptococcus pyogenes. A guide RNA provides targeting information; a nearby compatible PAM is also required for recognition.'],
  ['PAM & cut position', 'The PAM is a short DNA motif next to the target. For SpCas9, the common motif is NGG.', 'SpCas9’s HNH and RuvC domains cleave opposite strands. The break is commonly represented approximately three base pairs upstream of the PAM, although exact cleavage products can vary.'],
  ['GC content', 'GC content is the fraction of guide bases that are G or C. Ten G/C bases in a 20-base guide equals 50%.', 'A common initial range is roughly 40–60%, but sequence order, PAM-proximal bases, RNA folding, chromatin, delivery, nuclease, and cell type also matter. GC is a filter or warning—not a verdict.'],
  ['Strand orientation', 'DNA has two antiparallel strands, and a guide can target a sequence on either one.', 'The reported guide remains 5′→3′. “+” and “−” describe genomic orientation; forward is not inherently better than reverse. Both strands must be searched with proper reverse-complement handling.'],
  ['Exons, introns & transcripts', 'Primary RNA contains exons and introns. Splicing usually removes introns and joins exons.', 'Exons can contain coding sequence or untranslated regions. Introns may contain splice sites or regulatory elements. Alternative transcripts can include different exons, so transcript choice changes biological interpretation.'],
  ['Transcript coverage', 'Coverage asks how many relevant transcripts contain the targeted region.', 'If four of five selected protein-coding transcripts contain an exon, coverage is 4/5 or 80%. High coverage can suit broad knockout; lower coverage may be intentional for isoform-specific targeting.'],
  ['Knockout & end joining', 'A knockout aims to disrupt gene function, often after repair of a nuclease-created break.', 'End joining can create variable insertions or deletions. An indel may frameshift, remain in-frame, alter splicing, or preserve partial function. A coding cut does not guarantee knockout.'],
  ['Knock-in & HDR', 'Homology-directed repair uses a matching donor DNA template to introduce a precise change.', 'Homology means matching sequence; directed means repair follows the template; repair means the cell fixes damaged DNA. Efficiency varies with cut distance, donor design, cell cycle, cell type, and recutting risk.'],
  ['CRISPRa & CRISPRi', 'CRISPRa increases expression; CRISPRi reduces transcription without a conventional DNA break.', 'Catalytically inactive Cas proteins are fused to regulatory effectors. Targeting windows are system- and context-dependent, and alternative transcription start sites add uncertainty. CRISPRi is not a permanent gene knockout.'],
  ['Activity, specificity & off-targets', 'Activity estimates intended-site performance; specificity concerns similar unintended genomic sites.', 'Scores are model outputs—not certainty or exact editing percentages. Real off-target assessment examines mismatch position and identity, PAM compatibility, bulges, genomic annotation, and experimental validation.'],
]

export function LearnPage({ onDesign }: { onDesign: () => void }) {
  return (
    <main className="learn-page">
      <section className="learn-hero"><span className="overline">GUIDEWISE FIELD NOTES</span><h1>CRISPR concepts,<br /><em>without shortcuts.</em></h1><p>Begin with a plain-language model, then open the scientific detail. Every concept connects back to an experimental decision.</p><button className="primary-button" onClick={onDesign}>Apply this in a design →</button></section>
      <section className="splice-diagram" aria-labelledby="splice-heading">
        <div><span className="overline">TRANSCRIPT STRUCTURE</span><h2 id="splice-heading">From primary RNA to mature RNA</h2><p>Exons are not automatically fully coding, and introns are not automatically irrelevant.</p></div>
        <div className="splice-visual">
          <div className="primary-rna"><span>Exon 1</span><i>Intron 1</i><span>Exon 2</span><i>Intron 2</i><span>Exon 3</span></div>
          <b>RNA splicing ↓</b>
          <div className="mature-rna"><span>Exon 1</span><span>Exon 2</span><span>Exon 3</span></div>
        </div>
      </section>
      <section className="learn-grid" aria-label="CRISPR learning topics">
        {topics.map(([title, beginner, advanced], index) => (
          <article className="learn-card" key={title}>
            <span className="learn-index">{String(index + 1).padStart(2, '0')}</span><h2>{title}</h2>
            <div><span>BEGINNER</span><p>{beginner}</p></div>
            <details><summary>Advanced scientific explanation</summary><p>{advanced}</p></details>
          </article>
        ))}
      </section>
      <section className="validation-lesson"><div><span className="overline">THE ESSENTIAL LIMIT</span><h2>Why experimental validation is necessary</h2></div><p>Sequence-based predictions omit or approximate chromatin state, cell type, delivery, repair pathway choice, mosaic outcomes, genome variation, and many off-target mechanisms. A high score cannot establish efficacy or safety. Important intended and off-target sites require appropriate experimental measurement.</p></section>
    </main>
  )
}
