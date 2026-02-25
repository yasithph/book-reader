"use client";

import * as React from "react";

interface TopReaderPopupProps {
  rank: number;
  onDismiss: () => void;
}

export function TopReaderPopup({ rank, onDismiss }: TopReaderPopupProps) {
  const [visible, setVisible] = React.useState(false);
  const onDismissRef = React.useRef(onDismiss);

  React.useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  React.useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 100);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismissRef.current(), 300);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismissRef.current(), 300);
  };

  return (
    <div
      className={`top-reader-popup ${visible ? "top-reader-popup-visible" : ""}`}
      onClick={handleDismiss}
    >
      <img
        src={rank <= 3 ? "/images/generated/badge-top3.png" : "/images/generated/badge-top-reader.png"}
        alt=""
        style={{ width: 24, height: 24 }}
      />
      <span className="top-reader-popup-text">
        You&apos;re a Top Reader!
      </span>
    </div>
  );
}
