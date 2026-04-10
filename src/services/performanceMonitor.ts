import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from "web-vitals";

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
  url: string;
}

interface PageLoadMetric {
  page: string;
  loadTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private pageLoads: PageLoadMetric[] = [];
  private apiCalls: { endpoint: string; duration: number; timestamp: number }[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeWebVitals();
      this.trackPageLoad();
      this.trackNavigation();
    }
  }

  private initializeWebVitals() {
    // Track Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFID(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
  }

  private handleMetric(metric: Metric) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.pathname
    };

    this.metrics.push(performanceMetric);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating
      });
    }

    // Send to analytics service in production
    this.sendToAnalytics(performanceMetric);
  }

  private trackPageLoad() {
    if (typeof window === "undefined") return;

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        const pageLoad: PageLoadMetric = {
          page: window.location.pathname,
          loadTime,
          timestamp: Date.now()
        };

        this.pageLoads.push(pageLoad);

        if (process.env.NODE_ENV === "development") {
          console.log(`[Performance] Page load time: ${loadTime.toFixed(2)}ms`);
        }
      }
    });
  }

  private trackNavigation() {
    if (typeof window === "undefined") return;

    // Track SPA navigation (Next.js route changes)
    let lastPathname = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== lastPathname) {
        lastPathname = window.location.pathname;
        this.trackPageView(window.location.pathname);
      }
    });

    observer.observe(document.querySelector("body")!, {
      childList: true,
      subtree: true
    });
  }

  trackPageView(page: string) {
    const startTime = performance.now();

    // Track when page is fully rendered
    requestAnimationFrame(() => {
      const loadTime = performance.now() - startTime;
      
      const pageLoad: PageLoadMetric = {
        page,
        loadTime,
        timestamp: Date.now()
      };

      this.pageLoads.push(pageLoad);

      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] Page view: ${page} (${loadTime.toFixed(2)}ms)`);
      }
    });
  }

  trackAPICall(endpoint: string, duration: number) {
    const apiCall = {
      endpoint,
      duration,
      timestamp: Date.now()
    };

    this.apiCalls.push(apiCall);

    // Warn on slow API calls (>1000ms)
    if (duration > 1000 && process.env.NODE_ENV === "development") {
      console.warn(`[Performance] Slow API call: ${endpoint} (${duration}ms)`);
    }
  }

  getMetrics() {
    return {
      webVitals: this.metrics,
      pageLoads: this.pageLoads,
      apiCalls: this.apiCalls
    };
  }

  getAveragePageLoad(page?: string) {
    const loads = page 
      ? this.pageLoads.filter(p => p.page === page)
      : this.pageLoads;

    if (loads.length === 0) return 0;

    const total = loads.reduce((sum, load) => sum + load.loadTime, 0);
    return total / loads.length;
  }

  getAverageAPITime(endpoint?: string) {
    const calls = endpoint
      ? this.apiCalls.filter(c => c.endpoint.includes(endpoint))
      : this.apiCalls;

    if (calls.length === 0) return 0;

    const total = calls.reduce((sum, call) => sum + call.duration, 0);
    return total / calls.length;
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to analytics service (GA, PostHog, etc.)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        event_category: "Web Vitals"
      });
    }
  }

  // Clear old metrics (keep last 100 entries)
  cleanup() {
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    if (this.pageLoads.length > 100) {
      this.pageLoads = this.pageLoads.slice(-100);
    }
    if (this.apiCalls.length > 100) {
      this.apiCalls = this.apiCalls.slice(-100);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    performanceMonitor.cleanup();
  }, 5 * 60 * 1000);
}