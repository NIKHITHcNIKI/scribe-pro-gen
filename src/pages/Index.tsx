import { useState, useRef } from "react";
import { Hero } from "@/components/Hero";
import { LetterForm } from "@/components/LetterForm";
import { LetterPreview } from "@/components/LetterPreview";
import { FileText } from "lucide-react";

const Index = () => {
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const formRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLetterGenerated = (letter: string) => {
    setGeneratedLetter(letter);
  };

  const handleLetterUpdate = (newLetter: string) => {
    setGeneratedLetter(newLetter);
  };

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
          <p className="text-sm text-muted-foreground hidden sm:block">
            Professional AI-Powered Letter Generation
          </p>
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
            
            <LetterForm onLetterGenerated={handleLetterGenerated} />
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
              
              <LetterPreview letter={generatedLetter} onLetterUpdate={handleLetterUpdate} />
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
