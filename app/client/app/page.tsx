"use client";
import { RefreshCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import StockChart from "@/components/stock-chart";
import StockList from "@/components/stock-list";
import TimeFilter from "@/components/time-filter";
import { Stories } from "@/components/Stories";
import { AiAssistant } from "@/components/AiAssistant";
import { useEffect, useState } from "react";
import { TopMovers } from "@/components/TradeRepublicStories";
import { twMerge } from "tailwind-merge";


// Add window interface declaration for TypeScript
declare global {
  interface Window {
    fetchAndAddStock: (ticker: string) => Promise<void>;
  }
}


export type Timeframe = "1d" | "1wk" | "1mo" | "1y" | "max";

interface Data {
  stock_news: {
    [key: string]: BaseData;
  };
}

interface BaseData {
  companyName: string;
  change: number;
  logo: string;
  price: number;
  news: {
    content: string;
    created_at: string;
    headline: string;
    source: string;
  }[];
}

export interface Stock extends BaseData {
  ticker: string;
}
export interface StockWithBack extends Stock {
  previous: boolean;
}

export default function Home() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [chosenStock, setChosenStock] = useState<Stock | null>(null);
  const [following, setFollowing] = useState<string[]>([
    "TSLA",
    "GOOGL",
    "NFLX",
  ]);
  const [skipNewsFor, setSkipNewsFor] = useState<string[]>([]);

  const fetchAndAddStock = async (ticker: string) => {
    try {
      const response = await fetch(`http://localhost:8000/stock-data?ticker=${ticker}&period=1d`);
      const data = await response.json();
      
      const stockData: Stock = {
        ticker: data.stock_info.symbol,
        companyName: data.stock_info.name,
        price: data.stock_info.current_price,
        change: Number(((data.stock_info.current_price - data.stock_info.previous_close) / data.stock_info.previous_close * 100).toFixed(2)),
        logo: "/logo.png",
        news: [],
      };

      setFollowing(prev => [...prev, ticker]);
      setSkipNewsFor(prev => [...prev, ticker]);
      setData(prev => prev ? [...prev, stockData] : [stockData]);
      setChosenStock(stockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const followStock = (ticker: string) => {
    fetchAndAddStock(ticker);
  };

  const [investments, setInvestments] = useState<string[]>([
    "AMZN",
    "NVDA",
    "AAPL",
    "MSFT",
  ]);
  const [data, setData] = useState<Stock[] | null>(null);

  useEffect(() => {

    fetch(
      "http://127.0.0.1:8000/getSubscriptionStories",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tickers: [...investments, ...following] }),
      }
    )

      .then((res) => res.json())
      .then((responseData: Data) => {
        if (!responseData.stock_news) return;
        
        const updatedData = Object.entries(responseData.stock_news).map(([ticker, stock]) => ({
          ...stock,
          ticker,
        }));
        
        // Preserve the empty news arrays for skipped stocks
        const currentStocks = data || [];
        const skipNewsStocks = currentStocks.filter(stock => skipNewsFor.includes(stock.ticker));
        
        setData([...updatedData, ...skipNewsStocks.filter(skipStock => 
          !updatedData.some(stock => stock.ticker === skipStock.ticker))]);
      });
  }, [following, investments, skipNewsFor]);

  // Make fetchAndAddStock available globally for the Voice Agent
  useEffect(() => {
    // @ts-ignore
    window.fetchAndAddStock = fetchAndAddStock;
    
    return () => {
      // @ts-ignore
      delete window.fetchAndAddStock;
    };
  }, [fetchAndAddStock]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              style={{ borderRadius: "100px" }}
            />
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
      <main className="px-6 py-8 pl-20">
        <AiAssistant />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Section */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-2xl font-bold">
                  {chosenStock?.companyName ?? "Portfolio"}
                </h1>
                <div className="text-4xl font-bold mt-2">
                  {chosenStock?.price}
                </div>
                <div className="flex items-center mt-1">
                  {chosenStock?.change && (
                    <span
                      className={twMerge(
                        "text-green-500 mr-2",
                        (chosenStock?.change ?? 0) < 0 && "text-red-500"
                      )}
                    >
                      {chosenStock?.change ?? 0 > 0 ? "▲" : "▼"}{" "}
                      {chosenStock?.change}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <TimeFilter setTimeframe={setTimeframe} timeframe={timeframe} />

            <div className="mt-4 h-80">
              {chosenStock && <StockChart timeframe={timeframe} stock={chosenStock} />}
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-4">Stories</h2>
              <Stories
                stories={[
                  {
                    ticker: "TRP",
                    companyName: "Trade Republic",
                    change: 0,
                    price: 0,
                    logo: "/logo.png",
                    news: [
                      {
                        content: "Top Movers",
                        created_at: "",
                        headline: "Top Movers",
                        source: "Top Movers",
                      },
                      {
                        content: "Trade Republic Wrapped",
                        created_at: "",
                        headline: "Trade Republic Wrapped",
                        source: "Trade Republic Wrapped",
                      },
                    ],
                  },
                  ...(data ?? []),
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Investments Section */}
            <div className="flex flex-col mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Investments</h2>
                <div className="flex items-center">
                  <span className="text-blue-400 text-sm">Daily</span>

                  <svg
                    className="w-4 h-4 text-blue-400 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <StockList
                setChosenStock={setChosenStock}
                stocks={
                  data?.filter((stock) => investments.includes(stock.ticker)) ??
                  []
                }
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Following</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add stock..."
                    className="px-2 py-1 text-sm rounded bg-gray-800 border-none focus:ring-0 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const ticker = input.value.toUpperCase();
                        if (ticker && !following.includes(ticker)) {
                          followStock(ticker);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <span className="text-blue-400 text-sm">Daily</span>
                </div>
              </div>
              <StockList
                setChosenStock={setChosenStock}
                stocks={
                  data?.filter((stock) => following.includes(stock.ticker)) ??
                  []
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
