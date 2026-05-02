import "./App.css";

const weekStart = "Apr 28";
const weekEnd = "May 4";

// load all logs
const files = import.meta.glob("./data/short_form_log_*.json", { eager: true });

function extractName(path) {
  const match = path.match(/short_form_log_(.*)\.json$/);
  return match ? match[1] : "Unknown";
}

function getTotalSeconds(log) {
  return Object.values(log.totals_seconds).reduce(
    (sum, seconds) => sum + seconds,
    0
  );
}

function getTotalMinutes(log) {
  return Math.round(getTotalSeconds(log) / 60);
}

function getTopSource(log) {
  const entries = Object.entries(log.totals_seconds);

  const [topPlatform, topSeconds] = entries.reduce(
    (best, current) => {
      return current[1] > best[1] ? current : best;
    },
    ["None", 0]
  );

  if (topSeconds === 0) return null;
  return topPlatform;
}

function getIconPath(platform) {
  switch (platform) {
    case "YouTube Shorts":
      return "/icons/youtube.png";
    case "Instagram Reels":
      return "/icons/instagram.png";
    case "TikTok":
      return "/icons/tiktok.png";
    default:
      return null;
  }
}

const currentData = Object.entries(files).map(([path, data]) => {
  const log = data.default ?? data;
  const topSource = getTopSource(log);

  return {
    name: extractName(path),
    value: getTotalMinutes(log),
    iconPath: getIconPath(topSource),
  };
});

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

// HARD CODED CHANGE
function getFakeChange(place) {
  if (place === 1) return <span className="up">▲</span>;
  if (place === 2) return <span className="down">▼</span>;
  return <span className="same">-</span>;
}

function Leaderboard({ currentData }) {
  const currentRanked = getRankedData(currentData);

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
            <th>Top</th>
            <th>Change</th>
          </tr>
        </thead>

        <tbody>
          {currentRanked.map((row) => (
            <tr key={row.name} className={row.place === 1 ? "first" : ""}>
              <td>{getSuffix(row.place)}</td>
              <td className="name">{row.name}</td>
              <td>{row.value}</td>

              <td>
                {row.iconPath && (
                  <img
                    src={row.iconPath}
                    alt=""
                    className="icon"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </td>

              <td>{getFakeChange(row.place)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="prize">1st place prize: $20</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="page">
      <Leaderboard currentData={currentData} />
    </div>
  );
}