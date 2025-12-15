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
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from "docx";
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
    setEditedLetter(letter);
    setEditedTemplate(letterTemplate || null);
    setCopied(false);
    setIsEditing(false);
    setIsEditingHeader(false);
  }, [letter, letterTemplate]);

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

  // Helper function to load image as base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Helper to get contrast color
  const getContrastColor = (hexColor?: string): string => {
    if (!hexColor) return '#1f2937';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 2 * margin;
    
    let y = margin;
    const lineHeight = 6;

    // Set text color based on contrast
    const setTextColor = (hexColor?: string) => {
      const color = getContrastColor(hexColor);
      const rgb = hexToRgb(color);
      if (rgb) doc.setTextColor(rgb.r, rgb.g, rgb.b);
    };

    // Add letterhead background if exists
    if (editedTemplate && editedTemplate.organizationName) {
      const headerBg = editedTemplate.headerBackgroundColor;
      const style = editedTemplate.letterheadStyle || 'centered';

      // Draw header background for banner style
      if (style === 'banner' && headerBg) {
        const bgRgb = hexToRgb(headerBg);
        if (bgRgb) {
          doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
          doc.rect(0, 0, pageWidth, 50, 'F');
        }
      }

      // Render based on letterhead style
      if (style === 'banner') {
        setTextColor(headerBg);
        
        // Logo on left, text centered
        if (editedTemplate.logo) {
          try {
            const logoBase64 = await loadImageAsBase64(editedTemplate.logo);
            doc.addImage(logoBase64, 'PNG', margin, y, 18, 18);
          } catch (error) {
            console.error('Failed to load logo:', error);
          }
        }
        
        // Organization name centered
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        const orgName = editedTemplate.organizationName.toUpperCase();
        const orgNameWidth = doc.getTextWidth(orgName);
        doc.text(orgName, (pageWidth - orgNameWidth) / 2, y + 10);
        
        if (editedTemplate.tagline) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          const taglineWidth = doc.getTextWidth(editedTemplate.tagline);
          doc.text(editedTemplate.tagline, (pageWidth - taglineWidth) / 2, y + 17);
        }
        
        y += 28;
        
        // Sub-banner for address/contact
        if (headerBg) {
          const subBgRgb = hexToRgb(headerBg);
          if (subBgRgb) {
            doc.setFillColor(Math.max(0, subBgRgb.r - 20), Math.max(0, subBgRgb.g - 20), Math.max(0, subBgRgb.b - 20));
            doc.rect(0, y - 5, pageWidth, 18, 'F');
          }
        }
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        
        if (editedTemplate.address) {
          const addressOneLine = editedTemplate.address.split('\n').join(' • ');
          const addressWidth = doc.getTextWidth(addressOneLine);
          doc.text(addressOneLine, (pageWidth - addressWidth) / 2, y + 2);
        }
        
        const contactParts = [];
        if (editedTemplate.phone) contactParts.push(`Phone: ${editedTemplate.phone}`);
        if (editedTemplate.email) contactParts.push(`Email: ${editedTemplate.email}`);
        if (editedTemplate.website) contactParts.push(`Web: ${editedTemplate.website}`);
        
        if (contactParts.length > 0) {
          const contactText = contactParts.join("  |  ");
          const contactWidth = doc.getTextWidth(contactText);
          doc.text(contactText, (pageWidth - contactWidth) / 2, y + 9);
        }
        
        y += 20;

      } else if (style === 'side-by-side') {
        doc.setTextColor(0, 0, 0);
        
        let logoEndX = margin;
        if (editedTemplate.logo) {
          try {
            const logoBase64 = await loadImageAsBase64(editedTemplate.logo);
            doc.addImage(logoBase64, 'PNG', margin, y, 22, 22);
            logoEndX = margin + 28;
          } catch (error) {
            console.error('Failed to load logo:', error);
          }
        }
        
        // Vertical line
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.line(logoEndX, y, logoEndX, y + 22);
        
        // Text next to logo
        const textX = logoEndX + 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246); // Primary blue
        doc.text(editedTemplate.organizationName, textX, y + 6);
        
        if (editedTemplate.tagline) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(editedTemplate.tagline, textX, y + 12);
        }
        
        if (editedTemplate.address) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(editedTemplate.address.split('\n').join(' | '), textX, y + 17);
        }
        
        const contactParts = [];
        if (editedTemplate.phone) contactParts.push(`Phone: ${editedTemplate.phone}`);
        if (editedTemplate.email) contactParts.push(`Email: ${editedTemplate.email}`);
        if (editedTemplate.website) contactParts.push(`Web: ${editedTemplate.website}`);
        
        if (contactParts.length > 0) {
          doc.text(contactParts.join("  |  "), textX, y + 22);
        }
        
        y += 30;
        
        // Bottom border
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

      } else if (style === 'minimal') {
        doc.setTextColor(0, 0, 0);
        
        if (editedTemplate.logo) {
          try {
            const logoBase64 = await loadImageAsBase64(editedTemplate.logo);
            doc.addImage(logoBase64, 'PNG', margin, y, 12, 12);
          } catch (error) {
            console.error('Failed to load logo:', error);
          }
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(editedTemplate.organizationName, margin + (editedTemplate.logo ? 16 : 0), y + 8);
        
        // Contact on right
        const contactParts = [];
        if (editedTemplate.phone) contactParts.push(editedTemplate.phone);
        if (editedTemplate.email) contactParts.push(editedTemplate.email);
        if (editedTemplate.website) contactParts.push(editedTemplate.website);
        
        if (contactParts.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const contactText = contactParts.join("  |  ");
          const contactWidth = doc.getTextWidth(contactText);
          doc.text(contactText, pageWidth - margin - contactWidth, y + 8);
        }
        
        y += 16;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

      } else if (style === 'classic') {
        doc.setTextColor(0, 0, 0);
        
        if (editedTemplate.logo) {
          try {
            const logoBase64 = await loadImageAsBase64(editedTemplate.logo);
            doc.addImage(logoBase64, 'PNG', margin, y, 16, 16);
          } catch (error) {
            console.error('Failed to load logo:', error);
          }
        }
        
        // Centered text with classic styling
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        const orgName = editedTemplate.organizationName.toUpperCase();
        const orgNameWidth = doc.getTextWidth(orgName);
        doc.text(orgName, (pageWidth - orgNameWidth) / 2, y + 8);
        
        if (editedTemplate.tagline) {
          doc.setFont("times", "italic");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          const taglineWidth = doc.getTextWidth(editedTemplate.tagline);
          doc.text(editedTemplate.tagline, (pageWidth - taglineWidth) / 2, y + 14);
        }
        
        // Decorative line
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        const lineLen = 30;
        doc.line((pageWidth - lineLen) / 2, y + 18, (pageWidth + lineLen) / 2, y + 18);
        
        if (editedTemplate.address) {
          doc.setFont("times", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const addressOneLine = editedTemplate.address.split('\n').join(' | ');
          const addressWidth = doc.getTextWidth(addressOneLine);
          doc.text(addressOneLine, (pageWidth - addressWidth) / 2, y + 24);
        }
        
        const contactParts = [];
        if (editedTemplate.phone) contactParts.push(`Phone: ${editedTemplate.phone}`);
        if (editedTemplate.email) contactParts.push(`Email: ${editedTemplate.email}`);
        if (editedTemplate.website) contactParts.push(`Web: ${editedTemplate.website}`);
        
        if (contactParts.length > 0) {
          const contactText = contactParts.join("  |  ");
          const contactWidth = doc.getTextWidth(contactText);
          doc.text(contactText, (pageWidth - contactWidth) / 2, y + 30);
        }
        
        y += 38;
        
        // Double line border
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 10;

      } else {
        // Default: centered style
        doc.setTextColor(0, 0, 0);
        
        if (editedTemplate.logo) {
          try {
            const logoBase64 = await loadImageAsBase64(editedTemplate.logo);
            const logoHeight = 20;
            const logoWidth = 20;
            const logoX = (pageWidth - logoWidth) / 2;
            doc.addImage(logoBase64, 'PNG', logoX, y, logoWidth, logoHeight);
            y += logoHeight + 4;
          } catch (error) {
            console.error('Failed to load logo:', error);
          }
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        const orgName = editedTemplate.organizationName.toUpperCase();
        const orgNameWidth = doc.getTextWidth(orgName);
        doc.text(orgName, (pageWidth - orgNameWidth) / 2, y);
        y += 7;
        
        if (editedTemplate.tagline) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          const taglineWidth = doc.getTextWidth(editedTemplate.tagline);
          doc.text(editedTemplate.tagline, (pageWidth - taglineWidth) / 2, y);
          y += 6;
        }
        
        if (editedTemplate.address) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const addressOneLine = editedTemplate.address.split('\n').join(' • ');
          const addressWidth = doc.getTextWidth(addressOneLine);
          doc.text(addressOneLine, (pageWidth - addressWidth) / 2, y);
          y += 5;
        }
        
        const contactParts = [];
        if (editedTemplate.phone) contactParts.push(`Phone: ${editedTemplate.phone}`);
        if (editedTemplate.email) contactParts.push(`Email: ${editedTemplate.email}`);
        if (editedTemplate.website) contactParts.push(`Web: ${editedTemplate.website}`);
        
        if (contactParts.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const contactText = contactParts.join("  |  ");
          const contactWidth = doc.getTextWidth(contactText);
          doc.text(contactText, (pageWidth - contactWidth) / 2, y);
          y += 6;
        }
        
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    }

    // Reset text color for letter body
    doc.setTextColor(0, 0, 0);
    
    // Parse and render letter content with tables
    const contentLines = editedLetter.split('\n');
    let i = 0;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    while (i < contentLines.length) {
      const line = contentLines[i];
      
      // Check for ASCII art table format (+----+ style)
      if (/^\s*\+[-+]+\+\s*$/.test(line)) {
        const tableLines: string[] = [];
        while (i < contentLines.length && (/^\s*\+[-+]+\+\s*$/.test(contentLines[i]) || /^\s*\|.+\|\s*$/.test(contentLines[i]))) {
          tableLines.push(contentLines[i]);
          i++;
        }
        
        const dataRows = tableLines.filter(l => /^\s*\|.+\|\s*$/.test(l));
        
        if (dataRows.length > 0) {
          const headerCells = dataRows[0].split('|').filter(cell => cell.trim() !== '');
          const bodyRows = dataRows.slice(1).map(row => 
            row.split('|').filter(cell => cell.trim() !== '')
          );
          
          const colCount = headerCells.length;
          const colWidth = (maxWidth) / colCount;
          const cellPadding = 3;
          const rowHeight = 8;
          
          const tableHeight = (bodyRows.length + 1) * rowHeight;
          if (y + tableHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y, maxWidth, rowHeight, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          
          headerCells.forEach((cell, idx) => {
            const cellX = margin + idx * colWidth;
            doc.rect(cellX, y, colWidth, rowHeight, 'S');
            doc.text(cell.trim(), cellX + cellPadding, y + rowHeight - 2);
          });
          y += rowHeight;
          
          doc.setFont("helvetica", "normal");
          bodyRows.forEach((row) => {
            if (y + rowHeight > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            
            row.forEach((cell, idx) => {
              const cellX = margin + idx * colWidth;
              doc.rect(cellX, y, colWidth, rowHeight, 'S');
              doc.text(cell.trim(), cellX + cellPadding, y + rowHeight - 2);
            });
            y += rowHeight;
          });
          
          y += 5;
          continue;
        }
      }
      
      // Check for markdown table
      if (line.includes('|') && i + 1 < contentLines.length && /^\|?\s*[-:]+\s*\|/.test(contentLines[i + 1])) {
        const tableLines: string[] = [];
        while (i < contentLines.length && contentLines[i].includes('|')) {
          tableLines.push(contentLines[i]);
          i++;
        }
        
        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split('|').filter(cell => cell.trim() !== '');
          const bodyRows = tableLines.slice(2).map(row => 
            row.split('|').filter(cell => cell.trim() !== '')
          );
          
          const colCount = headerCells.length;
          const colWidth = (maxWidth) / colCount;
          const cellPadding = 3;
          const rowHeight = 8;
          
          const tableHeight = (bodyRows.length + 1) * rowHeight;
          if (y + tableHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y, maxWidth, rowHeight, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          
          headerCells.forEach((cell, idx) => {
            const cellX = margin + idx * colWidth;
            doc.rect(cellX, y, colWidth, rowHeight, 'S');
            doc.text(cell.trim(), cellX + cellPadding, y + rowHeight - 2);
          });
          y += rowHeight;
          
          doc.setFont("helvetica", "normal");
          bodyRows.forEach((row) => {
            if (y + rowHeight > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            
            row.forEach((cell, idx) => {
              const cellX = margin + idx * colWidth;
              doc.rect(cellX, y, colWidth, rowHeight, 'S');
              doc.text(cell.trim(), cellX + cellPadding, y + rowHeight - 2);
            });
            y += rowHeight;
          });
          
          y += 5;
        }
        continue;
      }
      
      // Regular text line
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      wrappedLines.forEach((wrappedLine: string) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(wrappedLine, margin, y);
        y += lineHeight;
      });
      
      i++;
    }
    
    doc.save("letter.pdf");
    
    toast({
      title: "Downloaded!",
      description: "Your letter has been saved as PDF",
    });
  };

  const handleDownloadWord = async () => {
    try {
      const paragraphs: (Paragraph | Table)[] = [];
      const style = editedTemplate?.letterheadStyle || 'centered';

      // Add letterhead if exists
      if (editedTemplate && editedTemplate.organizationName) {
        let logoBuffer: ArrayBuffer | null = null;
        
        // Load logo if exists
        if (editedTemplate.logo) {
          try {
            const response = await fetch(editedTemplate.logo);
            const blob = await response.blob();
            logoBuffer = await blob.arrayBuffer();
          } catch (error) {
            console.error('Failed to load logo for Word:', error);
          }
        }

        // Render based on letterhead style
        if (style === 'banner') {
          // Banner style - logo left, text centered
          if (logoBuffer) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 70, height: 70 },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
              })
            );
          }
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: editedTemplate.organizationName.toUpperCase(),
                  bold: true,
                  size: 36,
                  color: "FFFFFF",
                }),
              ],
              alignment: AlignmentType.CENTER,
              shading: { fill: editedTemplate.headerBackgroundColor?.replace('#', '') || "3B82F6" },
              spacing: { after: 50 },
            })
          );
          
          if (editedTemplate.tagline) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: editedTemplate.tagline,
                    italics: true,
                    size: 18,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                shading: { fill: editedTemplate.headerBackgroundColor?.replace('#', '') || "3B82F6" },
                spacing: { after: 100 },
              })
            );
          }

          if (editedTemplate.address) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: editedTemplate.address.split('\n').join(' • '),
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 },
              })
            );
          }

        } else if (style === 'side-by-side') {
          // Side by side - logo left with text to the right
          if (logoBuffer) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 80, height: 80 },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
              })
            );
          }
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: editedTemplate.organizationName,
                  bold: true,
                  size: 28,
                  color: "3B82F6",
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 50 },
            })
          );
          
          if (editedTemplate.tagline) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: editedTemplate.tagline,
                    italics: true,
                    size: 18,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 50 },
              })
            );
          }

          if (editedTemplate.address) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: editedTemplate.address.split('\n').join(' | '),
                    size: 16,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 50 },
              })
            );
          }

        } else if (style === 'minimal') {
          // Minimal - compact header
          if (logoBuffer) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 40, height: 40 },
                    type: 'png',
                  }),
                  new TextRun({ text: "   " }),
                  new TextRun({
                    text: editedTemplate.organizationName,
                    bold: true,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
              })
            );
          } else {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: editedTemplate.organizationName,
                    bold: true,
                    size: 24,
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
              })
            );
          }

        } else if (style === 'classic') {
          // Classic - formal with serif font
          if (logoBuffer) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 60, height: 60 },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
              })
            );
          }
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: editedTemplate.organizationName.toUpperCase(),
                  bold: true,
                  size: 32,
                  font: "Times New Roman",
                  color: "3B82F6",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 },
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
                    font: "Times New Roman",
                    color: "666666",
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
                    text: editedTemplate.address.split('\n').join(' | '),
                    size: 18,
                    font: "Times New Roman",
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 },
              })
            );
          }

        } else {
          // Default: centered style
          if (logoBuffer) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 80, height: 80 },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })
            );
          }

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: editedTemplate.organizationName.toUpperCase(),
                  bold: true,
                  size: 32,
                  color: "3B82F6",
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
                    color: "666666",
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
                    text: editedTemplate.address.split('\n').join(' • '),
                    size: 18,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 },
              })
            );
          }
        }

        // Contact info for all styles
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
                  size: 16,
                  color: "666666",
                }),
              ],
              alignment: style === 'side-by-side' || style === 'minimal' ? AlignmentType.LEFT : AlignmentType.CENTER,
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
                color: "CCCCCC",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }

      // Parse letter content with table support
      const letterLines = editedLetter.split('\n');
      let i = 0;

      while (i < letterLines.length) {
        const line = letterLines[i];

        // Check for ASCII art table format (+----+ style)
        if (/^\s*\+[-+]+\+\s*$/.test(line)) {
          const tableLines: string[] = [];
          while (i < letterLines.length && (/^\s*\+[-+]+\+\s*$/.test(letterLines[i]) || /^\s*\|.+\|\s*$/.test(letterLines[i]))) {
            tableLines.push(letterLines[i]);
            i++;
          }
          
          const dataRows = tableLines.filter(l => /^\s*\|.+\|\s*$/.test(l));
          
          if (dataRows.length > 0) {
            const headerCells = dataRows[0].split('|').filter(cell => cell.trim() !== '');
            const bodyRows = dataRows.slice(1).map(row => 
              row.split('|').filter(cell => cell.trim() !== '')
            );

            const tableRowsData = [headerCells, ...bodyRows];
            const tableRows = tableRowsData.map((rowData, rowIndex) => 
              new TableRow({
                children: rowData.map(cellText => 
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cellText.trim(),
                            bold: rowIndex === 0,
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                    shading: rowIndex === 0 ? { fill: "E0E0E0" } : undefined,
                  })
                ),
              })
            );

            paragraphs.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
            
            paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
            continue;
          }
        }

        // Check for markdown table
        if (line.includes('|') && i + 1 < letterLines.length && /^\|?\s*[-:]+\s*\|/.test(letterLines[i + 1])) {
          const tableLines: string[] = [];
          while (i < letterLines.length && letterLines[i].includes('|')) {
            tableLines.push(letterLines[i]);
            i++;
          }
          
          if (tableLines.length >= 2) {
            const headerCells = tableLines[0].split('|').filter(cell => cell.trim() !== '');
            const bodyRows = tableLines.slice(2).map(row => 
              row.split('|').filter(cell => cell.trim() !== '')
            );

            const tableRowsData = [headerCells, ...bodyRows];
            const tableRows = tableRowsData.map((rowData, rowIndex) => 
              new TableRow({
                children: rowData.map(cellText => 
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cellText.trim(),
                            bold: rowIndex === 0,
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                    shading: rowIndex === 0 ? { fill: "E0E0E0" } : undefined,
                  })
                ),
              })
            );

            paragraphs.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              })
            );
            
            paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
            continue;
          }
        }

        // Regular text line
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
        i++;
      }

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
        shareUrl = `https://web.whatsapp.com/send?text=${encodedText}`;
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

  // Function to parse and render markdown tables as HTML tables
  const renderLetterContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Check for ASCII art table format (+----+ style)
      if (/^\s*\+[-+]+\+\s*$/.test(line)) {
        const tableLines: string[] = [];
        while (i < lines.length && (/^\s*\+[-+]+\+\s*$/.test(lines[i]) || /^\s*\|.+\|\s*$/.test(lines[i]))) {
          tableLines.push(lines[i]);
          i++;
        }
        
        // Extract data rows (lines with |)
        const dataRows = tableLines.filter(l => /^\s*\|.+\|\s*$/.test(l));
        
        if (dataRows.length > 0) {
          // First row is header, rest are body
          const headerCells = dataRows[0].split('|').filter(cell => cell.trim() !== '');
          const bodyRows = dataRows.slice(1).map(row => 
            row.split('|').filter(cell => cell.trim() !== '')
          );

          elements.push(
            <table key={`table-${elements.length}`} style={{ borderCollapse: 'collapse', width: 'auto', margin: '16px 0' }}>
              <thead>
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th key={idx} style={{ 
                      border: '1px solid hsl(var(--border))', 
                      padding: '8px 12px', 
                      backgroundColor: 'hsl(var(--muted))',
                      fontWeight: 600,
                      textAlign: 'left'
                    }}>
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              {bodyRows.length > 0 && (
                <tbody>
                  {bodyRows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} style={{ 
                          border: '1px solid hsl(var(--border))', 
                          padding: '8px 12px' 
                        }}>
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          );
          continue;
        }
      }
      
      // Check if this line starts a markdown table (contains | and next line is separator)
      if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+\s*\|/.test(lines[i + 1])) {
        // Parse the table
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        
        if (tableLines.length >= 2) {
          // Parse header
          const headerCells = tableLines[0].split('|').filter(cell => cell.trim() !== '');
          
          // Parse body rows (skip separator line at index 1)
          const bodyRows = tableLines.slice(2).map(row => 
            row.split('|').filter(cell => cell.trim() !== '')
          );

          elements.push(
            <table key={`table-${elements.length}`} style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0' }}>
              <thead>
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th key={idx} style={{ 
                      border: '1px solid hsl(var(--border))', 
                      padding: '8px 12px', 
                      backgroundColor: 'hsl(var(--muted))',
                      fontWeight: 600,
                      textAlign: 'left'
                    }}>
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} style={{ 
                        border: '1px solid hsl(var(--border))', 
                        padding: '8px 12px' 
                      }}>
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
      } else {
        // Regular text line
        elements.push(
          <span key={`line-${i}`}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        );
        i++;
      }
    }

    return <div className="whitespace-pre-wrap">{elements}</div>;
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
            <div className="prose prose-slate max-w-none font-serif text-base leading-relaxed text-foreground">
              {renderLetterContent(editedLetter)}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
