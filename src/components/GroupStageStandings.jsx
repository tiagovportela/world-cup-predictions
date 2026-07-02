import { rankedGroupStage } from '../lib/groupStage'

// Group-stage leaderboard (final totals after the group games). Standings come
// from Firestore via props (edited in Admin), falling back to defaults upstream.
export default function GroupStageStandings({ standings = [] }) {
  const rows = rankedGroupStage(standings)

  if (rows.length === 0) {
    return <div className="text-center py-12 text-gray-500">No group-stage standings yet</div>
  }

  return (
    <div className="border border-gray-300 overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th className="w-12 text-center">#</th>
            <th className="text-left">Player</th>
            <th className="w-32 text-center">Total Points</th>
            <th className="w-24 text-center">Exact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((player) => (
            <tr key={player.userName} className="hover:bg-gray-100 transition-colors">
              <td className="text-center font-bold text-xl">
                {player.rank === 1 && '🏆'}
                {player.rank === 2 && '🥈'}
                {player.rank === 3 && '🥉'}
                {player.rank > 3 && <span className="text-gray-600">{player.rank}</span>}
              </td>
              <td className="font-500 text-black">{player.userName}</td>
              <td className="text-center">
                <span className={`badge ${player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : ''}`}>
                  {player.points}
                </span>
              </td>
              <td className="text-center">
                <span className="badge-outline">{player.exact}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
