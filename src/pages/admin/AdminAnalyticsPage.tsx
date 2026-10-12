import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  PageTitle,
  ChartCard,
  ChartTooltip,
  CHART,
  axisProps,
  yAxisProps,
} from "@/components/admin";
import { DemoNotice } from "@/components/common";
import {
  demoVisitorTrend,
  demoFunnel,
  demoTrafficSources,
  demoDevices,
  demoTopPages,
} from "@/data/analytics";
export default function AdminAnalyticsPage() {
  const visitors = demoVisitorTrend.reduce((sum, r) => sum + r.visitors, 0);
  return (
    <>
      <PageTitle
        title="Analytics"
        description="Explore sample visitor activity and the demonstration conversion funnel."
        demo
      />
      <DemoNotice>
        All figures below are sample data. No live traffic service or GA4
        measurement ID is connected.
      </DemoNotice>
      <div className="my-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sample visitors", value: visitors.toLocaleString() },
          { label: "Sample sessions", value: "5,000" },
          { label: "Sample conversion", value: "2.4%" },
        ].map((s) => (
          <div key={s.label} className="card p-6">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-3 font-display text-3xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Visitor trend"
          table={{
            columns: ["Date", "Visitors"],
            rows: demoVisitorTrend.map((r) => [r.date, r.visitors]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoVisitorTrend}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                dataKey="visitors"
                stroke={CHART.single}
                fill={CHART.singleWash}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Conversion funnel"
          table={{
            columns: ["Stage", "Count"],
            rows: demoFunnel.map((r) => [r.stage, r.value]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoFunnel} layout="vertical">
              <XAxis type="number" {...axisProps} />
              <YAxis
                type="category"
                dataKey="stage"
                width={120}
                {...axisProps}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" fill={CHART.single} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {[
          {
            title: "Traffic sources (%)",
            data: demoTrafficSources.map((r) => ({
              label: r.source,
              value: r.value,
            })),
          },
          {
            title: "Devices (%)",
            data: demoDevices.map((r) => ({ label: r.device, value: r.value })),
          },
        ].map((s) => (
          <ChartCard
            key={s.title}
            title={s.title}
            table={{
              columns: ["Source", "Percent"],
              rows: s.data.map((r) => [r.label, r.value]),
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.data}>
                <XAxis dataKey="label" {...axisProps} tick={{ fontSize: 10 }} />
                <YAxis {...yAxisProps} />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="value"
                  fill={CHART.single}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ))}
      </div>
      <section className="card relative mt-6 overflow-x-auto p-6">
        <h2 className="mb-4 text-xl">Sample top pages</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-3">Page</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {demoTopPages.map((p) => (
              <tr key={p.path} className="border-t border-line">
                <td className="py-3">{p.path}</td>
                <td>{p.views.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
