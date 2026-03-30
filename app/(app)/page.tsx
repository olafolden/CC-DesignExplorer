'use client'

import dynamic from 'next/dynamic'

const ExplorerClient = dynamic(() => import('@/components/ExplorerClient'), {
  ssr: false,
})

export default function ExplorePage() {
  return <ExplorerClient />
}
