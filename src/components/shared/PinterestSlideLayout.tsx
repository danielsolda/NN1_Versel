import { ReactNode, useEffect, useRef } from "react";

interface PinterestSlideLayoutProps {
  selectedId: string | null;
  onBack: () => void;
  gridContent: ReactNode;
  detailContent: ReactNode;
}

export default function PinterestSlideLayout({
  selectedId,
  onBack,
  gridContent,
  detailContent,
}: PinterestSlideLayoutProps) {
  return (
    <div className="relative w-full">
      {/* Grid view */}
      <div
        className="transition-all duration-400 ease-in-out"
        style={{
          opacity: selectedId ? 0 : 1,
          pointerEvents: selectedId ? "none" : "auto",
          position: selectedId ? "absolute" : "relative",
          width: "100%",
        }}
      >
        {gridContent}
      </div>

      {/* Detail view */}
      {selectedId && (
        <div
          className="animate-in slide-in-from-right-8 fade-in duration-300"
        >
          {detailContent}
        </div>
      )}
    </div>
  );
}
