import { RefreshCcw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import StockChart from "@/components/stock-chart"
import StockList from "@/components/stock-list"
import TimeFilter from "@/components/time-filter"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                className="block w-80 p-2 pl-10 text-sm rounded-lg bg-gray-800 border-none focus:ring-0 focus:outline-none"
                placeholder="Search stocks, ETFs, categories..."
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-200 hover:text-white">
              Wealth
            </Link>
            <Link href="#" className="text-gray-200 hover:text-white">
              Orders
            </Link>
            <Link href="#" className="text-gray-200 hover:text-white">
              Profile
            </Link>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              B
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Section */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold">Portfolio</h1>
                <div className="text-4xl font-bold mt-2">1,065.25 €</div>
                <div className="flex items-center mt-1">
                  <span className="text-green-500 mr-2">▲ 4.78 €</span>
                  <span className="text-green-500">(0.45 %)</span>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-800">
                <RefreshCcw className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <TimeFilter />

            <div className="mt-4 h-80">
              <StockChart />
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-4">Discover</h2>
              <h3 className="text-xl font-medium">Top movers</h3>
              {/* Top movers content would go here */}
            </div>
          </div>

          {/* Investments Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Investments</h2>
              <div className="flex items-center">
                <span className="text-blue-400 text-sm">Since buy</span>
                <svg className="w-4 h-4 text-blue-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <StockList />
          </div>
        </div>
      </main>
    </div>
  )
}
