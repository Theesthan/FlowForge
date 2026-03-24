'use client'

import { memo } from 'react'
import { MeshGradient } from '@paper-design/shaders-react'

const MeshGradientBackground = memo(function MeshGradientBackground() {
  return (
    <MeshGradient
      className="w-full h-full absolute inset-0 pointer-events-none"
      colors={['#000000', '#0a0a1a', '#050510', '#000000']}
      speed={0.2}
    />
  )
})

export default MeshGradientBackground
