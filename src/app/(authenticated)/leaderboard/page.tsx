"use client";

import * as React from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopReaderPopup } from "@/components/ui/top-reader-popup";
import { getAvatarUrl } from "@/lib/avatar";

interface LeaderboardEntry {
  user_id: string;
  engagement_score: number;
  rank: number;
  display_name: string | null;
  avatar_url: string | null;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [showBadgePopup, setShowBadgePopup] = React.useState(false);
  const [badgeRank, setBadgeRank] = React.useState(0);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [leaderboardRes, sessionRes, statsRes] = await Promise.all([
          fetch("/api/leaderboard"),
          fetch("/api/auth/session"),
          fetch("/api/user/stats"),
        ]);

        if (leaderboardRes.ok) {
          const { leaderboard } = await leaderboardRes.json();
          setEntries(leaderboard || []);
        }

        if (sessionRes.ok) {
          const { user } = await sessionRes.json();
          setCurrentUserId(user?.id || null);
        }

        if (statsRes.ok) {
          const { stats } = await statsRes.json();
          if (stats?.isTopReader && stats.badgeNotified === false) {
            setBadgeRank(stats.topReaderRank);
            setShowBadgePopup(true);
          }
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <main className="kindle-leaderboard">
        <header className="kindle-settings-header">
          <div className="kindle-settings-header-inner">
            <h1 className="kindle-settings-title">Top Readers</h1>
            <p className="kindle-settings-subtitle">Leaderboard</p>
          </div>
        </header>

        <div className="kindle-leaderboard-content">
          {loading ? (
            <div className="kindle-leaderboard-loading">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="kindle-leaderboard-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875 3.375 3.375 0 0016.5 7.5h0V18.75zm-9 0V7.5m0 0h0A3.375 3.375 0 004.125 10.875 3.375 3.375 0 007.5 14.25V18.75m0-11.25h9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p>No leaderboard data yet</p>
            </div>
          ) : (
            <div className="kindle-leaderboard-list">
              {entries.map((entry) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const isTopThree = entry.rank <= 3;
                const avatarSrc = getAvatarUrl(entry.avatar_url, entry.user_id);

                return (
                  <div
                    key={entry.user_id}
                    className={`kindle-leaderboard-item${isTopThree ? " kindle-leaderboard-item-top" : ""}${isCurrentUser ? " kindle-leaderboard-item-self" : ""}`}
                  >
                    <div className="kindle-leaderboard-rank">
                      {isTopThree ? (
                        <span className={`kindle-leaderboard-medal kindle-leaderboard-medal-${entry.rank}`}>
                          {entry.rank === 1 ? "1st" : entry.rank === 2 ? "2nd" : "3rd"}
                        </span>
                      ) : (
                        <span className="kindle-leaderboard-rank-num">{entry.rank}</span>
                      )}
                    </div>
                    <div className="kindle-leaderboard-avatar">
                      <img src={avatarSrc} alt="" />
                    </div>
                    <div className="kindle-leaderboard-info">
                      <span className="kindle-leaderboard-name">
                        {entry.display_name || "Reader"}
                        {isCurrentUser && <span className="kindle-leaderboard-you"> (You)</span>}
                      </span>
                    </div>
                    <div className="kindle-leaderboard-score">
                      {entry.engagement_score}
                      <span className="kindle-leaderboard-score-label">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showBadgePopup && badgeRank > 0 && (
        <TopReaderPopup
          rank={badgeRank}
          onDismiss={() => {
            setShowBadgePopup(false);
            fetch("/api/user/badge-notified", { method: "POST" }).catch(() => {});
          }}
        />
      )}

      <BottomNav isLoggedIn={true} />
    </>
  );
}
