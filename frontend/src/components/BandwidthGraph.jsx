// frontend/src/components/BandwidthGraph.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

// ==========================
// HELPERS
// ==========================

// Smooth last N points using moving average
function smoothSeries(data, windowSize = 5) {
  if (!data.length) return [];

  return data.map((point, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = data.slice(start, index + 1);

    const txAvg =
      window.reduce((sum, p) => sum + p.tx, 0) / window.length;
    const rxAvg =
      window.reduce((sum, p) => sum + p.rx, 0) / window.length;

    return { ...point, tx: txAvg, rx: rxAvg };
  });
}

// Convert Mbps to human readable bps / Kbps / Mbps
function formatSpeed(mbps) {
  const bps = mbps * 1_000_000;

  if (bps < 1000) return `${bps.toFixed(0)} bps`;
  if (bps < 1_000_000) return `${(bps / 1000).toFixed(2)} Kbps`;

  return `${mbps.toFixed(2)} Mbps`;
}

// Auto-scale Y axis
function getGraphMax(maxValue) {
  if (maxValue <= 1) return 1;
  if (maxValue <= 2) return 2;
  if (maxValue <= 5) return 5;
  if (maxValue <= 10) return 10;
  if (maxValue <= 20) return 20;
  if (maxValue <= 50) return 50;
  return 100;
}

// ==========================
// COMPONENT
// ==========================

export default function BandwidthGraph({ userId }) {
  const [data, setData] = useState([]); // last 90 samples
  const [current, setCurrent] = useState({ tx: 0, rx: 0 });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let interval;

    const fetchMetrics = async () => {
      try {
        const res = await api.get(`/profile/${userId}`);
        const metrics = res.data?.metrics;

        if (!metrics) return;

        const tx = metrics.txBps || 0;
        const rx = metrics.rxBps || 0;

        const txMbps = Number((tx / 1_000_000).toFixed(4));
        const rxMbps = Number((rx / 1_000_000).toFixed(4));

        setOnline(metrics.online);
        setCurrent({ tx: txMbps, rx: rxMbps });

        // Push lifecycle point
        setData((prev) =>
          [...prev.slice(-89), metrics.online ? { tx: txMbps, rx: rxMbps } : { tx: 0, rx: 0 }]
        );
      } catch (err) {
        console.error("Graph polling error:", err);
      }
    };

    interval = setInterval(fetchMetrics, 1000);
    fetchMetrics();

    return () => clearInterval(interval);
  }, [userId]);

  // ===== SMOOTH & SCALE DATA =====

  const smoothed = smoothSeries(data);

  const maxValue = Math.max(
    ...smoothed.map((d) => d.tx),
    ...smoothed.map((d) => d.rx),
    1
  );

  const graphMax = getGraphMax(maxValue);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mt-4">
      <h2 className="text-gray-300 text-sm font-semibold mb-3">
        Live Bandwidth Graph
      </h2>

      {/* Live speed labels */}
      <div className="flex gap-8 text-sm mb-3">
        <div className="text-blue-400 font-medium">
          TX: {formatSpeed(current.tx)}
        </div>
        <div className="text-green-400 font-medium">
          RX: {formatSpeed(current.rx)}
        </div>
      </div>

      {/* Graph */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={smoothed}>
            <XAxis hide />

            <YAxis
              stroke="#666"
              domain={[0, graphMax]}
              ticks={[
                0,
                graphMax * 0.25,
                graphMax * 0.5,
                graphMax * 0.75,
                graphMax,
              ]}
              tickFormatter={(v) => `${v} Mbps`}
            />

            <Tooltip
              contentStyle={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#fff",
              }}
              formatter={(value) => formatSpeed(value)}
              labelFormatter={() => ""}
            />

            <Line
              type="monotone"
              dataKey="tx"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="rx"
              stroke="#22C55E"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
