import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Copy, CheckCheck, Edit, Save, Languages } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface LetterPreviewProps {
  letter: string;
  onLetterUpdate?: (newLetter: string) => void;
}

export const LetterPreview = ({ letter, onLetterUpdate }: LetterPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLetter, setEditedLetter] = useState(letter);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedLetter);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Letter copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onLetterUpdate) {
      onLetterUpdate(editedLetter);
    }
    toast({
      title: "Saved!",
      description: "Your changes have been saved",
    });
  };

  const handleTranslate = async (language: string) => {
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-letter', {
        body: { letter: editedLetter, targetLanguage: language }
      });

      if (error) throw error;

      if (data?.translatedLetter) {
        setEditedLetter(data.translatedLetter);
        if (onLetterUpdate) {
          onLetterUpdate(data.translatedLetter);
        }
        toast({
          title: "Translated!",
          description: `Letter translated to ${language}`,
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
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
    const lines = doc.splitTextToSize(editedLetter, maxWidth);
    
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
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-3">
          <Select onValueChange={handleTranslate} disabled={isTranslating}>
            <SelectTrigger className="w-[200px] shadow-soft">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Translate to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Kannada">Kannada</SelectItem>
              <SelectItem value="Telugu">Telugu</SelectItem>
              <SelectItem value="Malayalam">Malayalam</SelectItem>
              <SelectItem value="Tamil">Tamil</SelectItem>
              <SelectItem value="Bengali">Bengali</SelectItem>
              <SelectItem value="Marathi">Marathi</SelectItem>
              <SelectItem value="Gujarati">Gujarati</SelectItem>
              <SelectItem value="Punjabi">Punjabi</SelectItem>
              <SelectItem value="Urdu">Urdu</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Italian">Italian</SelectItem>
              <SelectItem value="Portuguese">Portuguese</SelectItem>
              <SelectItem value="Chinese">Chinese</SelectItem>
              <SelectItem value="Japanese">Japanese</SelectItem>
              <SelectItem value="Korean">Korean</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
              <SelectItem value="Russian">Russian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <Button
              onClick={handleSave}
              className="shadow-medium hover:shadow-strong transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="shadow-soft hover:shadow-medium transition-all"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          
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
      </div>
      
      <Card className="p-8 shadow-medium">
        {isEditing ? (
          <Textarea
            value={editedLetter}
            onChange={(e) => setEditedLetter(e.target.value)}
            className="min-h-[500px] font-serif text-base leading-relaxed"
          />
        ) : (
          <div className="prose prose-slate max-w-none">
            <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground">
              {editedLetter}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};
