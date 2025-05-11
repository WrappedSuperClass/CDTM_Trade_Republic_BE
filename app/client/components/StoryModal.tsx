import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { TopMovers, TradeRepublicStories } from "./TradeRepublicStories";
import { Stock, StockWithBack } from "@/app/page";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "@mui/joy/IconButton";
interface StoryModalProps {
  content: StockWithBack | null;
  setContent: (content: StockWithBack) => void;
  isOpen: boolean;
  onClose: () => void;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onTrade: () => void;
  setViewedStory: (story: string) => void;
}

export function StoryModal({
  content,
  setContent,
  isOpen,
  onClose,
  isFollowing,
  onFollowToggle,
  onTrade,
  setViewedStory,
}: StoryModalProps) {
  const [pageNumber, setPageNumber] = useState(0);

  useEffect(() => {
    pageNumber === (content?.news.length ?? 0) - 1 &&
      setViewedStory(content?.ticker ?? "");
  }, [pageNumber]);

  const news = content?.news[pageNumber];
  if (!news) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black text-white border-gray-800 outline-none flex items-center justify-center gap-16">
        {pageNumber > 0 && (
          <IconButton
            sx={{ marginLeft: "-100px", color: "white" }}
            variant="plain"
            onClick={() => {
              setPageNumber(pageNumber - 1);
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}
        <div className="grow">
          <DialogHeader className="flex flex-row items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {content.previous && (
                <ChevronLeft
                  className="cursor-pointer w-7 h-7 p-1 -mr-1 -ml-4 hover:bg-gray-800 rounded-lg"
                  onClick={() => {
                    setContent({
                      ticker: "TRD",
                      companyName: "Trade Republic",
                      change: 0,
                      logo: "/logo.png",
                      news: [],
                      price: 0,
                      previous: false,
                    });
                  }}
                />
              )}
              <Image
                src={content.logo}
                alt={`${content.companyName} logo`}
                width={35}
                height={35}
                className="rounded-full"
              />
              <DialogTitle className="text-md font-semibold">
                {content.companyName}
                <div className="text-gray-400 !text-sm">{news.created_at}</div>
              </DialogTitle>
            </div>
            <div className="flex flex-row items-baseline gap-6">
              {content.companyName !== "Trade Republic" && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={onFollowToggle}
                  className={
                    isFollowing ? "border-gray-600 hover:bg-gray-800" : ""
                  }
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
              <div className="cursor-pointer  rounded-sm" onClick={onClose}>
                X
              </div>
            </div>
          </DialogHeader>

          {content.companyName === "Trade Republic" ? (
            <TradeRepublicStories
              setContent={setContent}
              pageNumber={pageNumber}
            />
          ) : (
            <>
              <div className="flex flex-col">{news.headline}</div>
              <div className="flex flex-col">{news.content}</div>
            </>
          )}

          {content.companyName !== "Trade Republic" && (
            <div className="mt-6 flex justify-end">
              <Button onClick={onTrade} variant="secondary">
                Trade
              </Button>
            </div>
          )}
        </div>
        {pageNumber < content.news.length - 1 && (
          <IconButton
            sx={{
              marginRight: "-100px",
              color: "white",
            }}
            onClick={() => {
              setPageNumber(pageNumber + 1);
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </DialogContent>
    </Dialog>
  );
}
