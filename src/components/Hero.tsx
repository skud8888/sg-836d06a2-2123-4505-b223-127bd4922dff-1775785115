import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Trusted by 500+ training organizations
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Transform Learning with
            <span className="block text-primary mt-2">Modern Training Management</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Streamline course creation, student enrollment, and progress tracking with our all-in-one platform built for educational excellence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground group">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="group">
              <PlayCircle className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6 animate-in fade-in duration-700 delay-500">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="bg-muted/50 p-3 border-b border-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground">
                  TrainHub Dashboard
                </div>
              </div>
              <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-muted/30 to-accent/10 flex items-center justify-center">
                <p className="text-muted-foreground">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}