import Image from "next/image";
import { Stock, StockWithBack } from "@/app/page";
import { useEffect, useState } from "react";

export function TradeRepublicStories({
  pageNumber,
  setContent,
}: {
  pageNumber: number;
  setContent: (content: StockWithBack) => void;
}) {
  const [wrapped, setWrapped] = useState<{ points: string[] } | null>(null);
  const [topMovers, setTopMovers] = useState<TopMovers | null>(null);
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/getTopMovers/`)
      .then((res) => res.json())
      .then((data) => {
        setTopMovers(data);
      });

    fetch(`http://127.0.0.1:8000/trading-wrapped/`)
      .then((res) => res.json())
      .then((data) => {
        setWrapped(data);
      });
  }, []);
  if (!topMovers || !wrapped) {
    return <div>Loading...</div>;
  }

  if (pageNumber === 0) {
    return <TopMovers data={topMovers} setContent={setContent} />;
  }
  return <Wrapped wrapped={wrapped.points} />;
}

export function Wrapped({ wrapped }: { wrapped: string[] }) {
  return (
    <div>
      <div className="text-xl mb-4">Trade Republic Wrapped</div>
      <div className="flex flex-col gap-2">
        {wrapped.map((w) => (
          <div className="text-base" key={w}>
            {w}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TopMovers {
  created_at: string;
  movers: {
    logo: string;
    name: string;
    percentChange: number;
    sources: string[];
    story: string;
    title: string;
    symbol: string;
  }[];
}

export function TopMovers({
  data,
  setContent,
}: {
  data: TopMovers;
  setContent: (content: StockWithBack) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-xl">Top Movers</div>
      <div className="flex gap-10 mt-4">
        <div className="flex flex-col gap-2">
          {data.movers
            .filter((mover) => mover.percentChange > 0)
            .map((mover) => (
              <div
                key={mover.name}
                className="flex flex-row gap-2 hover:bg-gray-800 p-2 rounded-md cursor-pointer"
                onClick={() => {
                  setContent({
                    change: mover.percentChange,
                    companyName: mover.name,
                    logo: mover.logo,
                    news: [
                      {
                        content: mover.story,
                        created_at: data.created_at,
                        headline: mover.title,
                        source: mover.sources[0],
                      },
                    ],
                    price: 0,
                    ticker: mover.symbol,
                    previous: true,
                  });
                }}
              >
                <Image
                  src={mover.logo}
                  alt={mover.name}
                  width={25}
                  height={25}
                />
                {mover.symbol}
                <span className="text-green-500">
                  {mover.percentChange.toFixed(2)}%
                </span>
              </div>
            ))}
        </div>
        <div className="flex flex-col gap-2">
          {data.movers
            .filter((mover) => mover.percentChange < 0)
            .map((mover) => (
              <div
                key={mover.name}
                className="flex flex-row gap-2 hover:bg-gray-800 p-2 rounded-md cursor-pointer"
                onClick={() => {
                  setContent({
                    change: mover.percentChange,
                    companyName: mover.name,
                    logo: mover.logo,
                    news: [
                      {
                        content: mover.story,
                        created_at: data.created_at,
                        headline: mover.title,
                        source: mover.sources[0],
                      },
                    ],
                    price: 0,
                    ticker: mover.symbol,
                    previous: true,
                  });
                }}
              >
                <Image
                  src={mover.logo}
                  alt={mover.name}
                  width={20}
                  height={20}
                />
                {mover.symbol}
                <span className="text-red-500">
                  {mover.percentChange.toFixed(2)}%
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
