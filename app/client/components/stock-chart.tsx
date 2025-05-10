"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts";
import { Timeframe } from "@/app/page";

interface StockData {
  close: number;
  timestamp: string;
}

export default function StockChart({ timeframe }: { timeframe: Timeframe }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<StockData[]>([]);
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/stock-data?ticker=AAPL&period=${timeframe}`)
      .then((response) => response.json())
      .then((data) => setData(data.historical_data));
  }, [timeframe]);

  console.log(data);
  if (!data || data.length === 0) return null;
  const chartData = data?.map((data) => data.close);
  const xAxisData = data.map((data) => {
    return new Date(data.timestamp);
  });

  return (
    <LineChart
      series={[{ data: chartData, showMark: false }]}
      xAxis={[
        {
          data: xAxisData,
          scaleType: "point",
          valueFormatter: (date: Date) => {
            if (!date) return "";
            return date.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
        },
      ]}
      colors={["white"]}
      height={400}
      sx={{
        width: "calc(100% + 50px)",
        marginLeft: "-50px",
      }}
    />
  );
}
