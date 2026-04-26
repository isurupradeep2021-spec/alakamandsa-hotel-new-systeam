import { useState, useEffect, useCallback } from "react";
import { getMonthlyAnalytics } from "../api/roomService";
import "./OperationalAnalyticsPage.css";

// ── helpers ────────────────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtHours(h) {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toFixed(1)} hrs`;
}

function pct(n, total) {
  if (!total) return "—";
  return `${((n / total) * 100).toFixed(1)}%`;
}

// ── small presentational components ──────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`oa-stat-card ${accent ? `oa-stat-card--${accent}` : ""}`}>
      <span className="oa-stat-value">{value}</span>
      <span className="oa-stat-label">{label}</span>
      {sub && <span className="oa-stat-sub">{sub}</span>}
    </div>
  );
}

function BarChart({ data, colorClass }) {
  const maxVal = Math.max(...Object.values(data), 1);
  return (
    <div className="oa-bar-chart">
      {Object.entries(data).map(([label, count]) => (
        <div key={label} className="oa-bar-row">
          <span className="oa-bar-label">{label}</span>
          <div className="oa-bar-track">
            <div
              className={`oa-bar-fill ${colorClass || ""}`}
              style={{ width: `${(count / maxVal) * 100}%` }}
            />
          </div>
          <span className="oa-bar-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────

export default function OperationalAnalyticsPage({ embedded = false }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMonthlyAnalytics(year, month);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  // month picker helpers
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const hk = data?.housekeeping;
  const mt = data?.maintenance;

  const content = (
    <div className={`oa-page ${embedded ? "oa-page--embedded" : ""}`}>
      {/* ── Header ── */}
      {!embedded && (
        <div className="oa-hero">
          <h1>Operational Analytics</h1>
          <p>Monthly performance insights for housekeeping and maintenance</p>
        </div>
      )}

      {/* ── Period picker ── */}
      <div className="oa-picker-bar">
        <label className="oa-picker-label">Period</label>
        <select
          className="oa-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className="oa-select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {months.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <button className="oa-btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <div className="oa-error">{error}</div>}

      {!data && !loading && !error && (
        <p className="oa-empty">Select a period to view analytics.</p>
      )}

      {data && (
        <>
          {/* ══════════════════════════════════════════════════════════════
              HOUSEKEEPING
          ══════════════════════════════════════════════════════════════ */}
          <section className="oa-section">
            <h2 className="oa-section-title">
              <span className="oa-section-icon">🧹</span> Housekeeping
            </h2>

            {hk && (
              <>
                <div className="oa-stats-grid">
                  <StatCard label="Total Tasks" value={hk.total} />
                  <StatCard
                    label="Completed"
                    value={hk.completed}
                    sub={pct(hk.completed, hk.total)}
                    accent="green"
                  />
                  <StatCard
                    label="In Progress"
                    value={hk.inProgress}
                    accent="blue"
                  />
                  <StatCard
                    label="Pending"
                    value={hk.pending}
                  />
                  <StatCard
                    label="Overdue"
                    value={hk.overdue}
                    accent={hk.overdue > 0 ? "red" : undefined}
                  />
                  <StatCard
                    label="Avg Resolution"
                    value={fmtHours(hk.avgResolutionHours)}
                    accent="purple"
                  />
                  <StatCard
                    label="On-Time Rate"
                    value={hk.onTimeRate != null ? `${hk.onTimeRate}%` : "—"}
                    accent="green"
                  />
                </div>

                <div className="oa-charts-row">
                  <div className="oa-chart-card">
                    <h3>By Task Type</h3>
                    <BarChart data={hk.byTaskType} colorClass="oa-bar--teal" />
                  </div>
                  <div className="oa-chart-card">
                    <h3>By Room Condition</h3>
                    <BarChart data={hk.byRoomCondition} colorClass="oa-bar--purple" />
                  </div>
                  <div className="oa-chart-card">
                    <h3>By Priority</h3>
                    <BarChart data={hk.byPriority} colorClass="oa-bar--orange" />
                  </div>
                </div>

                {Object.keys(hk.staffWorkload ?? {}).length > 0 && (
                  <div className="oa-chart-card oa-chart-card--wide">
                    <h3>Staff Workload (completed tasks)</h3>
                    <BarChart data={hk.staffWorkload} colorClass="oa-bar--teal" />
                  </div>
                )}
              </>
            )}
          </section>

          {/* ══════════════════════════════════════════════════════════════
              MAINTENANCE
          ══════════════════════════════════════════════════════════════ */}
          <section className="oa-section">
            <h2 className="oa-section-title">
              <span className="oa-section-icon">🔧</span> Maintenance
            </h2>

            {mt && (
              <>
                <div className="oa-stats-grid">
                  <StatCard label="Total Tickets" value={mt.total} />
                  <StatCard
                    label="Resolved"
                    value={mt.resolved}
                    sub={pct(mt.resolved, mt.total)}
                    accent="green"
                  />
                  <StatCard
                    label="In Progress"
                    value={mt.inProgress}
                    accent="blue"
                  />
                  <StatCard label="Open" value={mt.open} />
                  <StatCard
                    label="SLA Breaches"
                    value={mt.slaBreaches}
                    accent={mt.slaBreaches > 0 ? "red" : undefined}
                  />
                  <StatCard
                    label="Avg Resolution"
                    value={fmtHours(mt.avgResolutionHours)}
                    accent="purple"
                  />
                </div>

                <div className="oa-charts-row">
                  <div className="oa-chart-card">
                    <h3>By Facility Type</h3>
                    <BarChart data={mt.byFacilityType} colorClass="oa-bar--blue" />
                  </div>
                  <div className="oa-chart-card">
                    <h3>By Priority</h3>
                    <BarChart data={mt.byPriority} colorClass="oa-bar--orange" />
                  </div>
                </div>

                {mt.recurringRooms?.length > 0 && (
                  <div className="oa-chart-card oa-chart-card--wide">
                    <h3>Recurring Faults — Top Rooms</h3>
                    <table className="oa-table">
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Tickets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mt.recurringRooms.map((r) => (
                          <tr key={r.room}>
                            <td>{r.room}</td>
                            <td>
                              <span className="oa-badge oa-badge--red">{r.count}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {Object.keys(mt.staffWorkload ?? {}).length > 0 && (
                  <div className="oa-chart-card oa-chart-card--wide">
                    <h3>Staff Workload (resolved tickets)</h3>
                    <BarChart data={mt.staffWorkload} colorClass="oa-bar--blue" />
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );

  return content;
}
