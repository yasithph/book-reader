"use client";

interface TopReaderBadgeProps {
  size?: "sm" | "md";
  rank?: number;
}

export function TopReaderBadge({ size = "sm", rank }: TopReaderBadgeProps) {
  const isTopThree = rank !== undefined && rank <= 3;
  const badgeSrc = isTopThree
    ? "/images/generated/badge-top3.png"
    : "/images/generated/badge-top-reader.png";

  if (size === "sm") {
    return (
      <span className="top-reader-badge-sm" title={isTopThree ? `Top Reader #${rank}` : "Top Reader"}>
        <img src={badgeSrc} alt="" className="top-reader-badge-img-sm" />
      </span>
    );
  }

  return (
    <span className="top-reader-badge-md">
      <img src={badgeSrc} alt="" className="top-reader-badge-img-md" />
      <span className="top-reader-badge-label">
        {isTopThree ? `Top Reader #${rank}` : "Top Reader"}
      </span>
    </span>
  );
}
