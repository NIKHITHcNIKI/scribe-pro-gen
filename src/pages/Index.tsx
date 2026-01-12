import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { LetterForm } from "@/components/LetterForm";
import { LetterPreview } from "@/components/LetterPreview";
import { FileText, LogOut, Loader2, Sparkles } from "lucide-react";
import { LetterTemplate } from "@/components/LetterTemplates";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [letterTemplate, setLetterTemplate] = useState<LetterTemplate | null>(null);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleGetStarted = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLetterGenerated = (letter: string, template: LetterTemplate | null) => {
    setGeneratedLetter(letter);
    setLetterTemplate(template);
  };

  const handleLetterUpdate = (newLetter: string) => {
    setGeneratedLetter(newLetter);
  };

  const handleTemplateUpdate = (template: LetterTemplate) => {
    setLetterTemplate(template);
  };

  const handleReset = () => {
    setGeneratedLetter("");
    setLetterTemplate(null);
    setFormKey(prev => prev + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto animate-pulse-glow">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-300 group-hover:scale-105">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LetterGen
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {user.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Hero onGetStarted={handleGetStarted} />
        
        {/* Form Section */}
        <section ref={formRef} className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-hero -z-10" />
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Step 1: Fill in details
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5">Create Your Letter</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Fill in the details below and let AI craft the perfect letter for you
              </p>
            </div>
            
            <LetterForm key={formKey} onLetterGenerated={handleLetterGenerated} />
          </div>
        </section>

        {/* Preview Section */}
        {generatedLetter && (
          <section className="py-20 px-4 relative">
            <div className="absolute inset-0 bg-muted/30 -z-10" />
            <div className="container mx-auto max-w-4xl">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Step 2: Review & Download
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-5">Your Letter is Ready</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Review, translate, or download your professionally generated letter
                </p>
              </div>
              
              <LetterPreview 
                letter={generatedLetter} 
                letterTemplate={letterTemplate} 
                onLetterUpdate={handleLetterUpdate} 
                onTemplateUpdate={handleTemplateUpdate}
                onReset={handleReset} 
              />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 glass py-10 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">LetterGen</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 LetterGen. Powered by AI. All letters are generated fresh for your needs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;