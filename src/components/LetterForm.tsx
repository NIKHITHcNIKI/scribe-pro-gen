import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LETTER_TYPES = [
  { value: "business-proposal", label: "Business Proposal" },
  { value: "resignation", label: "Resignation Letter" },
  { value: "cover-letter", label: "Cover Letter" },
  { value: "recommendation", label: "Letter of Recommendation" },
  { value: "complaint", label: "Complaint Letter" },
  { value: "appreciation", label: "Appreciation Letter" },
  { value: "invitation", label: "Invitation Letter" },
  { value: "apology", label: "Apology Letter" },
  { value: "request", label: "Request Letter" },
  { value: "thank-you", label: "Thank You Letter" },
  { value: "authorization", label: "Authorization Letter" },
  { value: "intent", label: "Letter of Intent" },
  { value: "acceptance", label: "Acceptance Letter" },
  { value: "rejection", label: "Rejection Letter" },
  { value: "termination", label: "Termination Letter" },
  { value: "legal-notice", label: "Legal Notice" },
  { value: "employment-verification", label: "Employment Verification" },
  { value: "reference", label: "Reference Letter" },
  { value: "application", label: "Application Letter" },
  { value: "inquiry", label: "Inquiry Letter" },
  { value: "other", label: "Other" },
];

interface LetterFormProps {
  onLetterGenerated: (letter: string) => void;
}

export const LetterForm = ({ onLetterGenerated }: LetterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    letterType: "",
    senderName: "",
    senderAddress: "",
    recipientName: "",
    recipientAddress: "",
    subject: "",
    context: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.letterType || !formData.senderName || !formData.recipientName || !formData.subject) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-letter', {
        body: formData
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      onLetterGenerated(data.letter);
      
      toast({
        title: "Letter Generated!",
        description: "Your professional letter is ready",
      });
    } catch (error: any) {
      console.error('Error generating letter:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 shadow-medium">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="letterType" className="text-base font-semibold">
            Letter Type *
          </Label>
          <Select
            value={formData.letterType}
            onValueChange={(value) => setFormData({ ...formData, letterType: value })}
          >
            <SelectTrigger id="letterType" className="h-12">
              <SelectValue placeholder="Select letter type" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {LETTER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Sender Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="senderName">Your Name *</Label>
              <Input
                id="senderName"
                placeholder="John Doe"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senderAddress">Your Address</Label>
              <Textarea
                id="senderAddress"
                placeholder="123 Main St, City, State, ZIP"
                value={formData.senderAddress}
                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Recipient Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <Input
                id="recipientName"
                placeholder="Jane Smith"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Recipient Address</Label>
              <Textarea
                id="recipientAddress"
                placeholder="456 Business Ave, City, State, ZIP"
                value={formData.recipientAddress}
                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="text-base font-semibold">
            Subject *
          </Label>
          <Input
            id="subject"
            placeholder="Brief subject of your letter"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="context" className="text-base font-semibold">
            Additional Context
          </Label>
          <Textarea
            id="context"
            placeholder="Provide any additional details, background information, or specific points you want included in the letter..."
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
            rows={6}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            The more context you provide, the better the AI can tailor your letter
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full text-lg py-6 shadow-medium hover:shadow-strong transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Perfect Letter...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Letter
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
