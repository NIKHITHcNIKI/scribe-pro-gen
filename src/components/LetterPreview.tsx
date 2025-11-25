import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface LetterPreviewProps {
  letter: string;
}

export const LetterPreview = ({ letter }: LetterPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Letter copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Set margins
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 2 * margin;
    
    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(11);
    
    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(letter, maxWidth);
    
    let y = margin;
    const lineHeight = 7;
    
    lines.forEach((line: string) => {
      // Check if we need a new page
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      doc.text(line, margin, y);
      y += lineHeight;
    });
    
    doc.save("letter.pdf");
    
    toast({
      title: "Downloaded!",
      description: "Your letter has been saved as PDF",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="shadow-soft hover:shadow-medium transition-all"
        >
          {copied ? (
            <>
              <CheckCheck className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
        
        <Button
          onClick={handleDownloadPDF}
          className="shadow-medium hover:shadow-strong transition-all"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
      
      <Card className="p-8 shadow-medium">
        <div className="prose prose-slate max-w-none">
          <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground">
            {letter}
          </pre>
        </div>
      </Card>
    </div>
  );
};
