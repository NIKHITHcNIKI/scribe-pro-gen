import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Download } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero -z-10" />
      
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Letter Generation
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
            Generate Perfect Letters
            <span className="block mt-2 bg-gradient-primary bg-clip-text text-transparent">
              In Seconds
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Create professional, error-free letters for any purpose. Business, legal, personal, academic—all powered by advanced AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-medium hover:shadow-strong transition-all"
              onClick={onGetStarted}
            >
              <FileText className="w-5 h-5 mr-2" />
              Start Generating
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <Download className="w-5 h-5 mr-2" />
              View Examples
            </Button>
          </div>
          
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: FileText, title: "50+ Letter Types", desc: "Business, legal, personal, and more" },
              { icon: Sparkles, title: "AI-Powered", desc: "Zero errors, perfect formatting" },
              { icon: Download, title: "Instant Download", desc: "Get your letter as PDF instantly" }
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-6 rounded-xl bg-card border border-border shadow-soft hover:shadow-medium transition-all"
              >
                <feature.icon className="w-8 h-8 text-primary mb-3 mx-auto" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
