import type React from 'react'

const reactionSites = [
  'left-0 top-[3%] sm:left-[2%] sm:top-[4%]',
  'right-0 top-[3%] sm:right-[2%] sm:top-[4%]',
  'left-0 top-[37%] sm:left-[2%] sm:top-[37%]',
  'right-0 top-[37%] sm:right-[2%] sm:top-[37%]',
  'bottom-[2%] left-0 sm:bottom-[3%] sm:left-[2%]',
  'right-0 bottom-[2%] sm:right-[2%] sm:bottom-[3%]',
]

/** Existing session atom artwork follows a D–T fusion path over the site grid. */
export function ScientificFusionBackground() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {reactionSites.map((position, index) => <div
      key={position}
      className={`scientific-fusion-site absolute ${position}`}
      style={{ '--fusion-delay': `${index * -1.65}s` } as React.CSSProperties}
    >
      <div className="scientific-fusion-atom scientific-fusion-reactant scientific-fusion-reactant-left" />
      <div className="scientific-fusion-atom scientific-fusion-reactant scientific-fusion-reactant-right" />
      <div className="scientific-fusion-atom scientific-fusion-product" />
    </div>)}
  </div>
}
