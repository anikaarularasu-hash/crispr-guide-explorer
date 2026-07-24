import type { RankedGuide } from '../types/crispr'

export function TargetVisualization({ guides, selectedId, experiment }: { guides: RankedGuide[]; selectedId?: string; experiment: string }) {
  const min = Math.min(...guides.map((guide) => guide.genomicStart))
  const max = Math.max(...guides.map((guide) => guide.genomicEnd))
  const scale = (position: number) => 65 + ((position - min) / Math.max(1, max - min)) * 760
  return (
    <figure className="target-figure">
      <figcaption><div><span className="overline">TARGET MAP</span><h3>Candidate locations</h3></div><span>Coordinates are demonstration data</span></figcaption>
      <svg viewBox="0 0 900 190" role="img" aria-labelledby="target-title target-desc">
        <title id="target-title">{experiment} candidate guide target map</title>
        <desc id="target-desc">Exons are boxes connected by intron lines. Triangles show candidate cut locations; the selected guide is emphasized.</desc>
        <line x1="70" y1="104" x2="830" y2="104" className="intron-line" />
        <rect x="70" y="72" width="170" height="64" rx="4" className="utr-box" />
        <rect x="120" y="72" width="120" height="64" rx="4" className="exon-box" />
        <rect x="370" y="72" width="190" height="64" rx="4" className="exon-box" />
        <rect x="690" y="72" width="140" height="64" rx="4" className="exon-box late" />
        <text x="155" y="109">Exon 1</text><text x="435" y="109">Exon 2</text><text x="730" y="109">Exon 3</text>
        {guides.slice(0, 10).map((guide, index) => {
          const x = scale(guide.genomicStart)
          const selected = guide.id === selectedId
          return <g key={guide.id} className={selected ? 'selected-cut' : 'cut-site'}><line x1={x} y1={48} x2={x} y2={72} /><path d={`M ${x - 5} 48 L ${x + 5} 48 L ${x} 57 Z`} /><text x={x} y={index % 2 ? 158 : 32}>{index + 1}</text></g>
        })}
        <text x="70" y="178">5′</text><text x="816" y="178">3′</text>
      </svg>
      <div className="figure-legend"><span><i className="legend-coding" /> Coding exon</span><span><i className="legend-utr" /> Untranslated region</span><span><i className="legend-cut" /> Candidate cut</span><span><i className="legend-selected" /> Selected guide</span></div>
    </figure>
  )
}
