'use client'

import { memo } from 'react'
import { DotOrbit } from '@paper-design/shaders-react'

const DotOrbitBackground = memo(function DotOrbitBackground() {
  return (
    <DotOrbit
      className="w-full h-full absolute inset-0 pointer-events-none"
      dotColor="#333333"
      speed={0.5}
    />
  )
})

export default DotOrbitBackground
