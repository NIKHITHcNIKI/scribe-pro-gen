import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Download, Zap, Shield, Clock } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-hero -z-10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium shadow-medium animate-float">
            <Sparkles className="w-4 h-4" />
            AI-Powered Letter Generation
            <Zap className="w-4 h-4" />
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight">
            Generate Perfect Letters
            <span className="block mt-3 bg-gradient-primary bg-clip-text text-transparent">
              In Seconds
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Create professional, error-free letters for any purpose. 
            <span className="text-primary font-medium"> Business, legal, personal, academic</span>—all powered by advanced AI.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 bg-gradient-primary hover:opacity-90 shadow-medium hover:shadow-glow transition-all duration-300 group"
              onClick={onGetStarted}
            >
              <FileText className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Start Generating
              <Sparkles className="w-4 h-4 ml-2 group-hover:scale-125 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-10 py-7 border-2 hover:bg-secondary/50 hover:border-primary transition-all duration-300"
            >
              <Download className="w-5 h-5 mr-2" />
              View Examples
            </Button>
          </div>
          
          {/* Feature cards */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: FileText, title: "50+ Letter Types", desc: "Business, legal, personal, and more", color: "primary" },
              { icon: Shield, title: "AI-Powered", desc: "Zero errors, perfect formatting", color: "accent" },
              { icon: Clock, title: "Instant Download", desc: "Get your letter as PDF instantly", color: "primary" }
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-2xl glass border border-border/50 shadow-soft hover:shadow-medium hover-lift cursor-pointer"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};