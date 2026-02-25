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
      <span className="top-reader-badge-pill" title={isTopThree ? `Top Reader #${rank}` : "Top Reader"}>
        <svg className="top-reader-badge-pill-star" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 0l1.76 3.57 3.94.57-2.85 2.78.67 3.93L6 8.89 2.48 10.85l.67-3.93L.3 4.14l3.94-.57z" />
        </svg>
        <span className="top-reader-badge-pill-text">
          {isTopThree ? `#${rank}` : "Top"}
        </span>
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
