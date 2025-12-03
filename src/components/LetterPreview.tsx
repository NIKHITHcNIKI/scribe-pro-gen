import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Copy, CheckCheck, Edit, Save, Languages, Share2, RefreshCw, FileEdit, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { LetterTemplate } from "@/components/LetterTemplates";
import { LetterheadRenderer } from "@/components/LetterheadRenderer";

interface LetterPreviewProps {
  letter: string;
  letterTemplate?: LetterTemplate | null;
  onLetterUpdate?: (newLetter: string) => void;
  onTemplateUpdate?: (template: LetterTemplate) => void;
  onReset?: () => void;
}

export const LetterPreview = ({ letter, letterTemplate, onLetterUpdate, onTemplateUpdate, onReset }: LetterPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editedLetter, setEditedLetter] = useState(letter);
  const [editedTemplate, setEditedTemplate] = useState<LetterTemplate | null>(letterTemplate || null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditedTemplate(letterTemplate || null);
  }, [letterTemplate]);

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
    setIsEditingHeader(false);
    if (onLetterUpdate) {
      onLetterUpdate(editedLetter);
    }
    if (onTemplateUpdate && editedTemplate) {
      onTemplateUpdate(editedTemplate);
    }
    toast({
      title: "Saved!",
      description: "Your changes have been saved",
    });
  };

  const handleHeaderTemplateChange = (template: LetterTemplate) => {
    setEditedTemplate(template);
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

  const handleDownloadWord = async () => {
    try {
      const paragraphs: Paragraph[] = [];

      // Add letterhead if exists
      if (editedTemplate && editedTemplate.organizationName) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: editedTemplate.organizationName.toUpperCase(),
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );

        if (editedTemplate.tagline) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: editedTemplate.tagline,
                  italics: true,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            })
          );
        }

        if (editedTemplate.address) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: editedTemplate.address,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 },
            })
          );
        }

        const contactParts = [];
        if (editedTemplate.phone) contactParts.push(`Phone: ${editedTemplate.phone}`);
        if (editedTemplate.email) contactParts.push(`Email: ${editedTemplate.email}`);
        if (editedTemplate.website) contactParts.push(`Web: ${editedTemplate.website}`);

        if (contactParts.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: contactParts.join("  |  "),
                  size: 18,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          );
        }

        // Add separator line
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(80),
                size: 20,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }

      // Split letter content into paragraphs
      const letterLines = editedLetter.split('\n');
      letterLines.forEach((line) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "letter.docx");

      toast({
        title: "Downloaded!",
        description: "Your letter has been saved as Word document",
      });
    } catch (error) {
      console.error("Word download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to generate Word document",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(editedLetter);
    const shareTitle = encodeURIComponent("Check out this letter I created!");
    
    let shareUrl = "";
    
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?text=${encodedText}`;
        break;
      case "twitter":
        // Twitter has a 280 char limit, so we'll truncate
        const truncatedText = editedLetter.length > 250 
          ? editedLetter.substring(0, 247) + "..." 
          : editedLetter;
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncatedText)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodedText}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${shareTitle}&body=${encodedText}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
      toast({
        title: "Share opened!",
        description: `Opening ${platform} to share your letter`,
      });
    }
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
              <SelectItem value="English">English</SelectItem>
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

        <div className="flex flex-wrap gap-3">
          {onReset && (
            <Button
              variant="outline"
              onClick={onReset}
              className="shadow-soft hover:shadow-medium transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Letter
            </Button>
          )}

          {editedTemplate && editedTemplate.organizationName && (
            isEditingHeader ? (
              <Button
                onClick={handleSave}
                variant="secondary"
                className="shadow-soft hover:shadow-medium transition-all"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Header
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditingHeader(true)}
                className="shadow-soft hover:shadow-medium transition-all"
              >
                <FileEdit className="w-4 h-4 mr-2" />
                Edit Header
              </Button>
            )
          )}
          
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
              Edit Letter
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
            PDF
          </Button>

          <Button
            onClick={handleDownloadWord}
            variant="outline"
            className="shadow-soft hover:shadow-medium transition-all"
          >
            <FileText className="w-4 h-4 mr-2" />
            Word
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="shadow-soft hover:shadow-medium transition-all"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShare("whatsapp")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShare("telegram")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShare("twitter")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X (Twitter)
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShare("facebook")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShare("linkedin")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleShare("email")}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 6l-10 7L2 6"/>
                  </svg>
                  Email
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <Card 
        className="shadow-medium overflow-hidden"
        style={editedTemplate?.letterBackgroundColor ? { backgroundColor: editedTemplate.letterBackgroundColor } : {}}
      >
        {/* Letterhead Header */}
        {editedTemplate && editedTemplate.organizationName && (
          <div className="relative">
            {isEditingHeader && (
              <div className="absolute top-2 right-2 z-10">
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Editing Header - Click fields to edit
                </span>
              </div>
            )}
            <LetterheadRenderer 
              template={editedTemplate} 
              isEditing={isEditingHeader}
              onTemplateChange={handleHeaderTemplateChange}
            />
          </div>
        )}
        
        {/* Letter Content */}
        <div className="p-8">
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
        </div>
      </Card>
    </div>
  );
};
