import { useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import SwipeScreen from './screens/SwipeScreen'
import ResultsScreen from './screens/ResultsScreen'
import BottomNav from './components/BottomNav'
import data from './assets/candidates.json'
import { useVotes } from './hooks/useVotes'

export default function App() {
  const { votes } = useVotes()
  const { voted, remaining } = useMemo(() => {
    const voted = Object.keys(votes).filter((id) =>
      data.candidates.some((c) => c.id === id)
    ).length
    return { voted, remaining: data.candidates.length - voted }
  }, [votes])

  return (
    <div className="mx-auto w-full max-w-[430px] min-h-full relative">
      <Routes>
        <Route path="/" element={<SwipeScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
      </Routes>
      <BottomNav remaining={remaining} voted={voted} />
    </div>
  )
}
