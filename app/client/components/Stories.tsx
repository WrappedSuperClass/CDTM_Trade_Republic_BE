"use client";

import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { StoryModal } from "./StoryModal";
import { useState } from "react";
import { Stock, StockWithBack } from "@/app/page";

export function Stories({ stories }: { stories: Stock[] }) {
  const [selectedStory, setSelectedStory] = useState<StockWithBack | null>(
    null
  );
  const [viewedStories, setViewedStories] = useState<string[]>([]);

  return (
    <>
      {selectedStory && (
        <StoryModal
          content={selectedStory}
          setContent={setSelectedStory}
          isOpen={!!selectedStory}
          onClose={() => setSelectedStory(null)}
          isFollowing={false}
          onFollowToggle={() => {}}
          onTrade={() => {}}
          setViewedStory={(story) => {
            !viewedStories.includes(story) &&
              setViewedStories((prev) => [...prev, story]);
          }}
        />
      )}
      <div className="flex gap-4 overflow-x-auto pb-4 white-scrollbar">
        {stories.map((story) => (
          <StoryItem
            story={story}
            onClick={() => {
              setSelectedStory({
                ...story,
                previous: false,
              });
            }}
            key={story.ticker}
            newStory={!viewedStories.includes(story.ticker)}
          />
        ))}
      </div>
    </>
  );
}

function StoryItem({
  story,
  onClick,
  newStory,
}: {
  story: Stock;
  onClick: () => void;
  newStory: boolean;
}) {
  return (
    <div
      className={twMerge(
        "rounded-full grid place-items-center",
        newStory &&
          "p-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
      )}
    >
      <Image
        src={story.logo}
        alt="Logo"
        width={64}
        height={64}
        className={twMerge(
          "rounded-full cursor-pointer hover:brightness-75 transition-all duration-100 bg-white",
          ["AAPL", "MSFT"].includes(story.ticker) && "p-1"
        )}
        onClick={onClick}
      />
    </div>
  );
}
