import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyLogo: string;
  content: string;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onTrade: () => void;
}

interface TopMovers {}

export function StoryModal({
  isOpen,
  onClose,
  companyName,
  companyLogo,
  content,
  isFollowing,
  onFollowToggle,
  onTrade,
}: StoryModalProps) {
  const [news, setNews] = useState<any[]>([]);
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/getTopMovers`)
      .then((res) => res.json())
      .then((data) => setNews(data));
  }, []);

  console.log(news);
  // const movers = news?.map((item) => item.ticker);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black text-white border-gray-800">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={companyLogo}
              alt={`${companyName} logo`}
              width={40}
              height={40}
              className="rounded-full"
            />
            <DialogTitle className="text-lg font-semibold">
              {companyName}
            </DialogTitle>
          </div>
          <div className="flex flex-row items-baseline gap-6">
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={onFollowToggle}
              className={isFollowing ? "border-gray-600 hover:bg-gray-800" : ""}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
            <div className="cursor-pointer  rounded-sm" onClick={onClose}>
              X
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 text-gray-200">{content}</div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onTrade} variant="secondary">
            Trade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
