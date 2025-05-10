"use client";

import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { StoryModal } from "./StoryModal";
import { useState } from "react";

export function Stories() {
  const stories = [
    {
      id: "Trade Republic",
      src: "/logo.png",
      newStory: false,
      companyName: "Trade Republic",
    },
    ...Array.from({ length: 30 }, (_, index) => ({
      id: "a" + index + 1,
      src: "https://www.citypng.com/public/uploads/preview/hd-nvidia-eye-logo-icon-png-701751694965655t2lbe7yugk.png?v=2025050614",
      newStory: index % 3,
    })),
  ];
  const [modal, setModal] = useState<string | null>(null);
  return (
    <>
      <StoryModal
        isOpen={modal}
        onClose={() => setModal(null)}
        companyName={stories.find((story) => story.id === modal)?.id}
        companyLogo={stories.find((story) => story.id === modal)?.src}
        isFollowing={false}
        onFollowToggle={() => {}}
        onTrade={() => {}}
      />
      <div className="flex gap-4 overflow-x-auto pb-4 white-scrollbar">
        {stories.map((story) => (
          <StoryItem
            key={story.id}
            src={story.src}
            newStory={story.newStory}
            companyId="test"
            onClick={() => setModal(story.id)}
          />
        ))}
      </div>
    </>
  );
}

function StoryItem({
  companyId,
  src,
  newStory,
  onClick,
}: {
  companyId: string;
  src: string;
  newStory: boolean;
  onClick: () => void;
}) {
  return (
    <Image
      src={src ?? null}
      alt="Logo"
      width={64}
      height={64}
      className={twMerge(
        "rounded-full p-1 cursor-pointer hover:brightness-75 transition-all duration-100",
        newStory &&
          "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
      )}
      onClick={onClick}
    />
  );
}
