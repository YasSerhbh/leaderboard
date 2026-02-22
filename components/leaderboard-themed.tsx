import React from "react";
import { Team } from "./leaderboard-theme1";
import { LeaderboardTheme1 } from "./leaderboard-theme1";
import { LeaderboardTheme2 } from "./leaderboard-theme2";

interface ThemedLeaderboardProps {
    teams: Team[];
    showLogos?: boolean;
    activeTheme?: number;
}

/**
 * Switcher component — renders the correct theme based on `activeTheme` number.
 * Falls back to Theme 1 for any unknown theme number.
 */
export const ThemedLeaderboard: React.FC<ThemedLeaderboardProps> = ({
    teams,
    showLogos = true,
    activeTheme = 1,
}) => {
    switch (activeTheme) {
        case 2:
            return <LeaderboardTheme2 teams={teams} showLogos={showLogos} />;
        case 1:
        default:
            return <LeaderboardTheme1 teams={teams} showLogos={showLogos} />;
    }
};

export type { Team };
