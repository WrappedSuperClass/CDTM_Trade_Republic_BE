"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart, lineElementClasses } from "@mui/x-charts";
import { Timeframe, Stock } from "@/app/page";

interface StockData {
  close: number;
  timestamp: string;
  balance: number;
}

export default function StockChart({
  timeframe,
  stock,
}: {
  timeframe: Timeframe;
  stock: Stock | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<StockData[]>([]);
  useEffect(() => {
    fetch(
      stock?.ticker
        ? `http://127.0.0.1:8000/stock-data?ticker=${stock.ticker}&period=${timeframe}`
        : `http://127.0.0.1:8000/transaction-insights`,
      {
        cache: "no-store",
      }
    )
      .then((response) => response.json())
      .then((data) =>
        setData(stock?.ticker ? data.historical_data : data.transaktionen)
      );
  }, [timeframe, stock]);

  if (!data || data.length === 0) return null;
  const chartData = data?.map((data) =>
    stock?.ticker ? data.close : data.balance
  );
  const xAxisData = data.map((data) => {
    return new Date(data.timestamp);
  });

  return (
    <LineChart
      series={[{ id: "stock", data: chartData, showMark: false }]}
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
      colors={[
        data[data.length - 1].close > data[0].close ? "lightgreen" : "red",
        "lightgray",
      ]}
      height={400}
      sx={{
        width: "calc(100% + 50px)",
        marginLeft: "-50px",
      }}
    />
  );
}
