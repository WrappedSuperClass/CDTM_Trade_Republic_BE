"use client";

import { Timeframe } from "@/app/page";
import { useState } from "react";

export default function TimeFilter({
  timeframe,
  setTimeframe,
}: {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}) {
  const filters = [
    { id: "1d", label: "1D" },
    { id: "1wk", label: "1W" },
    { id: "1mo", label: "1M" },
    { id: "1y", label: "1Y" },
    { id: "max", label: "Max" },
  ] as const;

  return (
    <div className="flex space-x-2 mt-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`px-3 py-1 rounded-full text-sm ${
            timeframe === filter.id
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setTimeframe(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
