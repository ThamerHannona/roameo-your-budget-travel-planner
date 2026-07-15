// Budget math helpers for trips.
// Default split: 40% transport (flights) / 35% lodging / 25% other.

export interface BudgetSplit {
  transport: number; // percentages (0-100)
  lodging: number;
  other: number;
}

export const DEFAULT_SPLIT: BudgetSplit = {
  transport: 40,
  lodging: 35,
  other: 25,
};

export interface BudgetEnvelope {
  total: number;
  transportCap: number;
  lodgingCap: number;
  otherCap: number;
}

export function computeBudgetEnvelope(
  total: number,
  split: BudgetSplit = DEFAULT_SPLIT
): BudgetEnvelope {
  return {
    total,
    transportCap: Math.round((total * split.transport) / 100),
    lodgingCap: Math.round((total * split.lodging) / 100),
    otherCap: Math.round((total * split.other) / 100),
  };
}

export interface CategorySpend {
  transport: number;
  lodging: number;
  other: number;
}

export function tripTotalStatus(
  envelope: BudgetEnvelope,
  spend: CategorySpend
) {
  const spent = spend.transport + spend.lodging + spend.other;
  const remaining = envelope.total - spent;
  return {
    spent,
    remaining,
    pctUsed: envelope.total > 0 ? (spent / envelope.total) * 100 : 0,
    overBudget: remaining < 0,
    perCategory: {
      transport: {
        spent: spend.transport,
        cap: envelope.transportCap,
        over: spend.transport > envelope.transportCap,
      },
      lodging: {
        spent: spend.lodging,
        cap: envelope.lodgingCap,
        over: spend.lodging > envelope.lodgingCap,
      },
      other: {
        spent: spend.other,
        cap: envelope.otherCap,
        over: spend.other > envelope.otherCap,
      },
    },
  };
}

/** Remaining lodging budget once a flight has been picked. */
export function remainingLodgingAfterFlight(
  envelope: BudgetEnvelope,
  flightPrice: number
): number {
  const leftover = envelope.total - flightPrice - envelope.otherCap;
  return Math.max(0, Math.round(leftover));
}
