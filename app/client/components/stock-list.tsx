import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react"

// Stock data
const stocks = [
  {
    id: 1,
    name: "Apple",
    ticker: "1.410595",
    price: "248.63 €",
    change: "-12.50 €",
    isPositive: false,
    logo: "/apple-logo.svg",
  },
  {
    id: 2,
    name: "Xpeng (ADR)",
    ticker: "5.92238",
    price: "103.57 €",
    change: "+3.57 €",
    isPositive: true,
    logo: "/xpeng-logo.svg",
  },
  {
    id: 3,
    name: "Amazon.com",
    ticker: "0.60251",
    price: "103.44 €",
    change: "+3.44 €",
    isPositive: true,
    logo: "/amazon-logo.svg",
  },
  {
    id: 4,
    name: "Berkshire Hathaway (B)",
    ticker: "0.209226",
    price: "95.53 €",
    change: "-4.47 €",
    isPositive: false,
    logo: "/berkshire-logo.svg",
  },
  {
    id: 5,
    name: "Alphabet (A)",
    ticker: "0.701557",
    price: "95.23 €",
    change: "-4.77 €",
    isPositive: false,
    logo: "/alphabet-logo.svg",
  },
  {
    id: 6,
    name: "Alibaba Group (ADR)",
    ticker: "0.526315",
    price: "58.95 €",
    change: "+8.95 €",
    isPositive: true,
    logo: "/alibaba-logo.svg",
  },
  {
    id: 7,
    name: "SAP",
    ticker: "0.216966",
    price: "56.70 €",
    change: "+6.70 €",
    isPositive: true,
    logo: "/sap-logo.svg",
  },
  {
    id: 8,
    name: "Tesla",
    ticker: "0.205592",
    price: "54.55 €",
    change: "+4.55 €",
    isPositive: true,
    logo: "/tesla-logo.svg",
  },
  {
    id: 9,
    name: "Airbnb (A)",
    ticker: "0.448752",
    price: "50.26 €",
    change: "+0.26 €",
    isPositive: true,
    logo: "/airbnb-logo.svg",
  },
  {
    id: 10,
    name: "BYD",
    ticker: "1.105705",
    price: "48.93 €",
    change: "-1.07 €",
    isPositive: false,
    logo: "/byd-logo.svg",
  },
  {
    id: 11,
    name: "Meta Platforms (A)",
    ticker: "0.092449",
    price: "48.70 €",
    change: "-1.30 €",
    isPositive: false,
    logo: "/meta-logo.svg",
  },
  {
    id: 12,
    name: "Lufthansa",
    ticker: "7.584951",
    price: "47.65 €",
    change: "-2.35 €",
    isPositive: false,
    logo: "/lufthansa-logo.svg",
  },
  {
    id: 13,
    name: "Brown & Brown",
    ticker: "0.472589",
    price: "46.73 €",
    change: "-3.27 €",
    isPositive: false,
    logo: "/brown-logo.svg",
  },
]

export default function StockList() {
  return (
    <div className="space-y-4">
      {stocks.map((stock) => (
        <div key={stock.id} className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 flex-shrink-0">
              {/* Placeholder for company logos */}
              <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center">
                {stock.name.charAt(0)}
              </div>
            </div>
            <div>
              <div className="font-medium">{stock.name}</div>
              <div className="text-gray-500 text-xs">×{stock.ticker}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{stock.price}</div>
            <div
              className={`text-xs flex items-center justify-end ${stock.isPositive ? "text-green-500" : "text-red-500"}`}
            >
              {stock.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              {stock.change}
            </div>
          </div>
          {stock.id === 5 && (
            <button className="ml-2 text-gray-400">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
