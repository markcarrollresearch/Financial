import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compact, money } from "../finance/format";
export function TrendChart({
  data,
}: {
  data: { month: string; budget: number; actual: number }[];
}) {
  return (
    <>
      <div className="chart-legend">
        <span>
          <i style={{ background: "#c3ad91" }} />
          Budget
        </span>
        <span>
          <i style={{ background: "#762123" }} />
          Actual expenses
        </span>
      </div>
      <div
        className="trend-chart"
        role="img"
        aria-label="Monthly budget and actual expenses, January through September 2026. Exact values are available in the data table below."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 4, left: 0, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid vertical={false} stroke="#edf0eb" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#59645e", fontSize: 11 }}
              dy={7}
            />
            <YAxis
              width={64}
              tickFormatter={compact}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#59645e", fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: "#f2f1ed" }}
              formatter={(value, name) => [
                money(Number(value)),
                name === "budget" ? "Budget" : "Actual expenses",
              ]}
              contentStyle={{
                border: "1px solid #dfe4dd",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Bar
              isAnimationActive={false}
              dataKey="budget"
              fill="#c3ad91"
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
            />
            <Bar
              isAnimationActive={false}
              dataKey="actual"
              fill="#762123"
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="chart-data">
        <summary>View monthly amounts</summary>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">
              Monthly budget and expenses in dollars
            </caption>
            <thead>
              <tr>
                <th>Month</th>
                <th className="numeric">Budget</th>
                <th className="numeric">Expenses</th>
                <th className="numeric">Variance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.month}>
                  <th scope="row">{r.month}</th>
                  <td className="numeric">{money(r.budget)}</td>
                  <td className="numeric">{money(r.actual)}</td>
                  <td className="numeric">{money(r.budget - r.actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
