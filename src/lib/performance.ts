/**
 * Performance Budget Monitor
 * 
 * Tracks and alerts on performance metrics
 */

export interface PerformanceBudget {
  fcp: number;  // First Contentful Paint (ms)
  lcp: number;  // Largest Contentful Paint (ms)
  fid: number;  // First Input Delay (ms)
  cls: number;  // Cumulative Layout Shift
  ttfb: number; // Time to First Byte (ms)
  totalSize: number; // Total page size (KB)
  jsSize: number; // JavaScript size (KB)
  cssSize: number; // CSS size (KB)
  imageSize: number; // Image size (KB)
}

export interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
}

export interface BudgetViolation {
  metric: keyof PerformanceBudget;
  actual: number;
  budget: number;
  exceededBy: number;
  severity: 'warning' | 'critical';
}

// Default performance budgets (based on web.dev recommendations)
export const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1800,      // Good: < 1.8s
  lcp: 2500,      // Good: < 2.5s
  fid: 100,       // Good: < 100ms
  cls: 0.1,       // Good: < 0.1
  ttfb: 600,      // Good: < 600ms
  totalSize: 1024, // 1MB total
  jsSize: 300,    // 300KB JS
  cssSize: 100,   // 100KB CSS
  imageSize: 500  // 500KB images
};

/**
 * Collect current performance metrics
 */
export function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  return new Promise((resolve) => {
    const metrics: PerformanceMetrics = {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0
    };

    // Web Vitals using PerformanceObserver
    if ('PerformanceObserver' in window) {
      // FCP
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {
        // Ignore
      }

      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // Ignore
      }

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.fid = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // Ignore
      }

      // CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // Ignore
      }
    }

    // Navigation Timing for TTFB
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
    }

    // Resource sizes
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    resources.forEach(resource => {
      const size = resource.transferSize / 1024; // Convert to KB
      
      if (resource.name.endsWith('.js')) {
        metrics.jsSize += size;
      } else if (resource.name.endsWith('.css')) {
        metrics.cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        metrics.imageSize += size;
      }
      
      metrics.totalSize += size;
    });

    // Resolve after a delay to allow metrics to be collected
    setTimeout(() => resolve(metrics), 3000);
  });
}

/**
 * Check metrics against budget
 */
export function checkBudget(
  metrics: PerformanceMetrics, 
  budget: PerformanceBudget = DEFAULT_BUDGET
): BudgetViolation[] {
  const violations: BudgetViolation[] = [];

  // Check each metric
  const checks: Array<{ key: keyof PerformanceBudget; value: number | null }> = [
    { key: 'fcp', value: metrics.fcp },
    { key: 'lcp', value: metrics.lcp },
    { key: 'fid', value: metrics.fid },
    { key: 'cls', value: metrics.cls },
    { key: 'ttfb', value: metrics.ttfb },
    { key: 'totalSize', value: metrics.totalSize },
    { key: 'jsSize', value: metrics.jsSize },
    { key: 'cssSize', value: metrics.cssSize },
    { key: 'imageSize', value: metrics.imageSize }
  ];

  checks.forEach(({ key, value }) => {
    if (value === null) return;
    
    const budgetValue = budget[key];
    if (value > budgetValue) {
      const exceededBy = value - budgetValue;
      const percentage = (exceededBy / budgetValue) * 100;
      
      violations.push({
        metric: key,
        actual: value,
        budget: budgetValue,
        exceededBy,
        severity: percentage > 50 ? 'critical' : 'warning'
      });
    }
  });

  return violations;
}

/**
 * Format performance report
 */
export function formatPerformanceReport(
  metrics: PerformanceMetrics,
  violations: BudgetViolation[]
): string {
  let report = `Performance Budget Report\n`;
  report += `=========================\n\n`;

  report += `Core Web Vitals:\n`;
  report += `  FCP: ${metrics.fcp ? Math.round(metrics.fcp) + 'ms' : 'N/A'}\n`;
  report += `  LCP: ${metrics.lcp ? Math.round(metrics.lcp) + 'ms' : 'N/A'}\n`;
  report += `  FID: ${metrics.fid ? Math.round(metrics.fid) + 'ms' : 'N/A'}\n`;
  report += `  CLS: ${metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'}\n`;
  report += `  TTFB: ${metrics.ttfb ? Math.round(metrics.ttfb) + 'ms' : 'N/A'}\n\n`;

  report += `Resource Sizes:\n`;
  report += `  Total: ${Math.round(metrics.totalSize)}KB\n`;
  report += `  JavaScript: ${Math.round(metrics.jsSize)}KB\n`;
  report += `  CSS: ${Math.round(metrics.cssSize)}KB\n`;
  report += `  Images: ${Math.round(metrics.imageSize)}KB\n\n`;

  if (violations.length === 0) {
    report += `✅ All metrics within budget!\n`;
  } else {
    report += `⚠️  Budget Violations:\n\n`;
    
    const critical = violations.filter(v => v.severity === 'critical');
    const warnings = violations.filter(v => v.severity === 'warning');

    if (critical.length > 0) {
      report += `🔴 CRITICAL:\n`;
      critical.forEach(v => {
        report += `   ${v.metric}: ${Math.round(v.actual)} (budget: ${v.budget}, exceeded by ${Math.round(v.exceededBy)})\n`;
      });
      report += `\n`;
    }

    if (warnings.length > 0) {
      report += `🟡 WARNINGS:\n`;
      warnings.forEach(v => {
        report += `   ${v.metric}: ${Math.round(v.actual)} (budget: ${v.budget}, exceeded by ${Math.round(v.exceededBy)})\n`;
      });
    }
  }

  return report;
}

/**
 * Monitor performance and log violations
 */
export async function monitorPerformance(
  budget: PerformanceBudget = DEFAULT_BUDGET,
  onViolation?: (violations: BudgetViolation[]) => void
): Promise<void> {
  const metrics = await collectPerformanceMetrics();
  const violations = checkBudget(metrics, budget);

  if (violations.length > 0) {
    console.warn('Performance budget violations detected:', violations);
    
    if (onViolation) {
      onViolation(violations);
    }
  }

  // Log report to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(formatPerformanceReport(metrics, violations));
  }
}