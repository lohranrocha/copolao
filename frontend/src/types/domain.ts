export type UserRole = "ADMIN" | "PARTICIPANT";

export type User = {
  id: string;
  name: string;
  nickname: string | null;
  email: string;
  role: UserRole;
};

export type ComputedMatchState = "OPEN" | "LOCKED" | "FINISHED" | "CANCELLED";

export type Match = {
  id: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  groupCode: string | null;
  stage: string;
  venue: string;
  city: string;
  matchDateUtc: string;
  lockAtUtc: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  computedState: ComputedMatchState;
  myPrediction: Prediction | null;
};

export type Prediction = {
  id: string;
  userId?: string;
  matchId?: string;
  homeScorePrediction: number;
  awayScorePrediction: number;
  points: number;
  isExactScore: boolean;
  isCorrectResult: boolean;
  updatedAt: string;
};

export type RankingEntry = {
  position: number;
  user: {
    id: string;
    name: string;
    nickname: string | null;
  };
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  missedPredictions: number;
};
