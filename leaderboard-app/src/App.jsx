import "./App.css";

const weekStart = "Apr 28";
const weekEnd = "May 4";

const currentData = [
  { name: "Alice", value: 120 },
  { name: "Bob", value: 95 },
  { name: "Charlie", value: 140 },
  { name: "Dana", value: 80 },
];

const previousData = [
  { name: "Alice", value: 100 },
  { name: "Bob", value: 130 },
  { name: "Charlie", value: 90 },
  { name: "Dana", value: 85 },
];

function getRankedData(data) {
  return [...data]
    .sort((a, b) => a.value - b.value)
    .map((row, index) => ({
      ...row,
      place: index + 1,
    }));
}

function getSuffix(place) {
  if (place % 100 >= 11 && place % 100 <= 13) return `${place}th`;

  switch (place % 10) {
    case 1:
      return `${place}st`;
    case 2:
      return `${place}nd`;
    case 3:
      return `${place}rd`;
    default:
      return `${place}th`;
  }
}

function Leaderboard({ currentData, previousData }) {
  const currentRanked = getRankedData(currentData);
  const previousRanked = getRankedData(previousData);

  const previousPlaces = new Map(
    previousRanked.map((row) => [row.name, row.place])
  );

  return (
    <div className="card">
      <h1 className="title">Doomscrolling leaderboard</h1>

      <p className="subtitle">
        Least time spent consuming short form video {weekStart} - {weekEnd}
      </p>

      <table className="leaderboard">
        <thead>
          <tr>
            <th>Place</th>
            <th>User</th>
            <th>Minutes</th>
            <th>Change</th>
          </tr>
        </thead>

        <tbody>
          {currentRanked.map((row) => {
            const oldPlace = previousPlaces.get(row.name);
            const change = oldPlace ? oldPlace - row.place : 0;

            return (
              <tr key={row.name} className={row.place === 1 ? "first" : ""}>
                <td>{getSuffix(row.place)}</td>
                <td className="name">{row.name}</td>
                <td>{row.value}</td>
                <td>
                  {change > 0 && <span className="up">▲ {change}</span>}
                  {change < 0 && <span className="down">▼ {Math.abs(change)}</span>}
                  {change === 0 && <span className="same">-</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="prize">1st place prize: $20</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="page">
      <Leaderboard currentData={currentData} previousData={previousData} />
    </div>
  );
}