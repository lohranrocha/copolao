export type UserRole = "ADMIN" | "PARTICIPANT";

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "CANCELLED";

export type User = {
  id: string;
  name: string;
  nickname: string | null;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
  acceptedInviteCode?: string | null;
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
    avatarUrl?: string | null;
  };
  totalPoints: number;
  matchPoints: number;
  bonusPoints: number;
  exactScores: number;
  correctResults: number;
  missedPredictions: number;
};

export type InviteCode = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  accessCode: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: string;
  paidAt: string | null;
};

export type BonusQuestionState = "OPEN" | "LOCKED" | "SETTLED";

export type BonusPrediction = {
  id: string;
  answer: string;
  points: number;
  isCorrect: boolean;
  updatedAt: string;
};

export type BonusQuestion = {
  id: string;
  title: string;
  description: string;
  points: number;
  lockAtUtc: string;
  correctAnswer: string | null;
  computedState: BonusQuestionState;
  myPrediction: BonusPrediction | null;
};

export type GroupStandingState = BonusQuestionState;

export type GroupStandingPrediction = {
  id: string;
  groupCode: string;
  firstTeam: string;
  secondTeam: string;
  thirdTeam: string;
  fourthTeam: string;
  points: number;
  correctPositions: number;
  isPerfect: boolean;
  updatedAt: string;
};

export type GroupStandingResult = {
  id: string;
  groupCode: string;
  firstTeam: string;
  secondTeam: string;
  thirdTeam: string;
  fourthTeam: string;
  updatedAt: string;
};

export type GroupStandingBonus = {
  groupCode: string;
  teams: string[];
  lockAtUtc: string;
  computedState: GroupStandingState;
  result: GroupStandingResult | null;
  myPrediction: GroupStandingPrediction | null;
};

export type QualifiedGroup = {
  groupCode: string;
  teams: string[];
  result: GroupStandingResult | null;
  directQualifiedTeams: string[];
  thirdPlacedTeam: string | null;
};

export type AdminGroupStanding = Omit<GroupStandingBonus, "myPrediction"> & {
  predictionCount: number;
};

export type AdminBonusQuestion = Omit<BonusQuestion, "myPrediction"> & {
  isActive: boolean;
  predictions: Array<BonusPrediction & {
    user: {
      id: string;
      name: string;
      nickname: string | null;
    };
  }>;
};

export type PredictionBoardParticipant = {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl?: string | null;
};

export type PredictionBoardPrediction = {
  userId: string;
  user: PredictionBoardParticipant;
  hidden: boolean;
  homeScorePrediction?: number;
  awayScorePrediction?: number;
  points?: number;
  isExactScore?: boolean;
  isCorrectResult?: boolean;
};

export type PredictionBoardMatch = {
  id: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  groupCode: string | null;
  stage: string;
  matchDateUtc: string;
  lockAtUtc: string;
  homeScore: number | null;
  awayScore: number | null;
  computedState: ComputedMatchState;
  isPublic: boolean;
  viewerCanSeePredictions: boolean;
  predictions: PredictionBoardPrediction[];
};

export type AdminKnockoutMatch = {
  matchNumber: number;
  stage: string;
  label: string;
  homeSlot: string;
  awaySlot: string;
  matchDateUtc: string;
  match: Match | null;
};
