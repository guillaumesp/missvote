import { useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import SwipeScreen from './screens/SwipeScreen'
import ResultsScreen from './screens/ResultsScreen'
import GroupScreen from './screens/GroupScreen'
import BottomNav from './components/BottomNav'
import data from './assets/candidates.json'
import { useVotes } from './hooks/useVotes'
import { useGroup } from './p2p/group'

export default function App() {
  const { votes } = useVotes()
  const group = useGroup()
  const online = group.profile ? Object.keys(group.peers).length + 1 : 0
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
        <Route path="/groupe" element={<GroupScreen />} />
      </Routes>
      <BottomNav remaining={remaining} voted={voted} online={online} />
    </div>
  )
}
