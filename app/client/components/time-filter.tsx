"use client"

import { useState } from "react"

export default function TimeFilter() {
  const [activeFilter, setActiveFilter] = useState("1D")

  const filters = [
    { id: "1D", label: "1D" },
    { id: "1W", label: "1W" },
    { id: "1M", label: "1M" },
    { id: "1Y", label: "1Y" },
    { id: "Max", label: "Max" },
  ]

  return (
    <div className="flex space-x-2 mt-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`px-3 py-1 rounded-full text-sm ${
            activeFilter === filter.id ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveFilter(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
