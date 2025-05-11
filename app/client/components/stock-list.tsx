import { Stock } from "@/app/page";
import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";
import Image from "next/image";
export default function StockList({
  stocks,
  setChosenStock,
}: {
  stocks: Stock[];
  setChosenStock: (stock: Stock) => void;
}) {
  return (
    <div className="space-y-1">
      {stocks.map((stock) => (
        <div
          key={stock.ticker}
          className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-900 p-2 rounded-lg"
          onClick={() => setChosenStock(stock)}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 mr-3 flex-shrink-0">
              {/* Placeholder for company logos */}
              <div className="w-8 h-8 bg-white rounded-sm overflow-hidden flex items-center justify-center">
                <Image
                  src={stock.logo}
                  alt={stock.companyName}
                  width={32}
                  height={32}
                />
              </div>
            </div>
            <div>
              <div className="font-medium">{stock.companyName}</div>
              <div className="text-gray-500 text-xs">×{stock.ticker}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{stock.price}</div>
            <div
              className={`text-xs flex items-center justify-end ${
                stock.change > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {stock.change > 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              {stock.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
