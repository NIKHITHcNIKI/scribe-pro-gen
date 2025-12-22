import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { LetterForm } from "@/components/LetterForm";
import { LetterPreview } from "@/components/LetterPreview";
import { FileText, LogOut, Loader2 } from "lucide-react";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-soft">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LetterGen
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Hero onGetStarted={handleGetStarted} />
        
        <section ref={formRef} className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Create Your Letter</h2>
              <p className="text-xl text-muted-foreground">
                Fill in the details below and let AI craft the perfect letter for you
              </p>
            </div>
            
            <LetterForm key={formKey} onLetterGenerated={handleLetterGenerated} />
          </div>
        </section>

        {generatedLetter && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Your Letter is Ready</h2>
                <p className="text-xl text-muted-foreground">
                  Review, copy, or download your professionally generated letter
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

      <footer className="border-t border-border bg-card/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 LetterGen. Powered by AI. All letters are generated fresh for your needs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
