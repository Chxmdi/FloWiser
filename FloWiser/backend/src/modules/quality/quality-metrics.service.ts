import type { CanonicalQuality, QualityStatus } from "@flowiser/schemas";

type QualityMetricsSnapshot = {
  totalEvaluations: number;
  byStatus: Record<QualityStatus, number>;
  topFlags: Array<{ flag: string; count: number }>;
};

export class QualityMetricsService {
  private totalEvaluations = 0;
  private readonly byStatus: Record<QualityStatus, number> = {
    unknown: 0,
    good: 0,
    suspicious: 0,
    bad: 0
  };
  private readonly flagCounts = new Map<string, number>();

  record(quality: CanonicalQuality) {
    this.totalEvaluations += 1;
    this.byStatus[quality.status] += 1;

    for (const flag of quality.flags) {
      this.flagCounts.set(flag, (this.flagCounts.get(flag) ?? 0) + 1);
    }
  }

  snapshot(): QualityMetricsSnapshot {
    return {
      totalEvaluations: this.totalEvaluations,
      byStatus: { ...this.byStatus },
      topFlags: [...this.flagCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 10)
        .map(([flag, count]) => ({ flag, count }))
    };
  }
}
