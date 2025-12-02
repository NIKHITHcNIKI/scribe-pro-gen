import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, Briefcase, User, Hospital, Scale, Landmark, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type LetterheadStyle = "banner" | "side-by-side" | "centered" | "minimal" | "classic";

export interface LetterTemplate {
  id: string;
  name: string;
  type: string;
  logo?: string;
  organizationName: string;
  tagline?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  letterheadStyle: LetterheadStyle;
}

const PRESET_TEMPLATES: { id: string; name: string; icon: React.ReactNode; description: string; defaults: Partial<LetterTemplate> }[] = [
  {
    id: "none",
    name: "No Template",
    icon: <User className="w-5 h-5" />,
    description: "Simple letter without letterhead",
    defaults: {}
  },
  {
    id: "college",
    name: "College/University",
    icon: <GraduationCap className="w-5 h-5" />,
    description: "Academic letterhead with institution details",
    defaults: {
      type: "college",
      organizationName: "University Name",
      tagline: "Excellence in Education Since 1900",
      address: "123 University Avenue\nCity, State 12345",
      phone: "(555) 123-4567",
      email: "info@university.edu",
      website: "www.university.edu"
    }
  },
  {
    id: "corporate",
    name: "Corporate/Business",
    icon: <Building2 className="w-5 h-5" />,
    description: "Professional business letterhead",
    defaults: {
      type: "corporate",
      organizationName: "Company Name Inc.",
      tagline: "Innovation & Excellence",
      address: "456 Business Park\nSuite 100\nCity, State 12345",
      phone: "(555) 987-6543",
      email: "contact@company.com",
      website: "www.company.com"
    }
  },
  {
    id: "law-firm",
    name: "Law Firm",
    icon: <Scale className="w-5 h-5" />,
    description: "Legal practice letterhead",
    defaults: {
      type: "law-firm",
      organizationName: "Smith & Associates",
      tagline: "Attorneys at Law",
      address: "789 Legal Plaza\n10th Floor\nCity, State 12345",
      phone: "(555) 456-7890",
      email: "legal@smithlaw.com",
      website: "www.smithlaw.com"
    }
  },
  {
    id: "hospital",
    name: "Hospital/Medical",
    icon: <Hospital className="w-5 h-5" />,
    description: "Healthcare institution letterhead",
    defaults: {
      type: "hospital",
      organizationName: "City General Hospital",
      tagline: "Caring for Our Community",
      address: "100 Medical Center Drive\nCity, State 12345",
      phone: "(555) 234-5678",
      email: "info@cityhospital.org",
      website: "www.cityhospital.org"
    }
  },
  {
    id: "government",
    name: "Government/Official",
    icon: <Landmark className="w-5 h-5" />,
    description: "Official government letterhead",
    defaults: {
      type: "government",
      organizationName: "Department of Services",
      tagline: "Serving the Public",
      address: "Government Building\n1 Main Street\nCity, State 12345",
      phone: "(555) 111-2222",
      email: "contact@gov.gov",
      website: "www.gov.gov"
    }
  },
  {
    id: "startup",
    name: "Startup/Tech",
    icon: <Briefcase className="w-5 h-5" />,
    description: "Modern tech company letterhead",
    defaults: {
      type: "startup",
      organizationName: "TechStart Labs",
      tagline: "Building Tomorrow's Solutions",
      address: "Innovation Hub\n555 Tech Boulevard\nCity, State 12345",
      phone: "(555) 333-4444",
      email: "hello@techstart.io",
      website: "www.techstart.io"
    }
  }
];

interface LetterTemplatesProps {
  onTemplateChange: (template: LetterTemplate | null) => void;
}

export const LetterTemplates = ({ onTemplateChange }: LetterTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [customTemplate, setCustomTemplate] = useState<LetterTemplate>({
    id: "custom",
    name: "Custom",
    type: "custom",
    organizationName: "",
    address: "",
    letterheadStyle: "banner",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `logo-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('letter-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('letter-attachments')
        .getPublicUrl(data.path);

      const updated = { ...customTemplate, logo: urlData.publicUrl };
      setCustomTemplate(updated);
      if (selectedTemplate !== "none") {
        onTemplateChange(updated);
      }
      toast({ title: "Logo uploaded", description: "Your logo has been added" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not upload logo", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLogo = () => {
    const updated = { ...customTemplate, logo: undefined };
    setCustomTemplate(updated);
    if (selectedTemplate !== "none") {
      onTemplateChange(updated);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId === "none") {
      onTemplateChange(null);
      return;
    }

    const preset = PRESET_TEMPLATES.find(t => t.id === templateId);
    if (preset && preset.defaults.organizationName) {
      const template: LetterTemplate = {
        id: templateId,
        name: preset.name,
        type: preset.defaults.type || templateId,
        organizationName: preset.defaults.organizationName,
        tagline: preset.defaults.tagline,
        address: preset.defaults.address || "",
        phone: preset.defaults.phone,
        email: preset.defaults.email,
        website: preset.defaults.website,
        letterheadStyle: customTemplate.letterheadStyle,
      };
      setCustomTemplate(template);
      onTemplateChange(template);
    }
  };

  const handleCustomChange = (field: keyof LetterTemplate, value: string) => {
    const updated = { ...customTemplate, [field]: value };
    setCustomTemplate(updated);
    if (selectedTemplate !== "none") {
      onTemplateChange(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Letter Template</Label>
        <p className="text-sm text-muted-foreground">
          Choose a letterhead template for professional formatting
        </p>
      </div>

      <RadioGroup
        value={selectedTemplate}
        onValueChange={handleTemplateSelect}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {PRESET_TEMPLATES.map((template) => (
          <div key={template.id}>
            <RadioGroupItem
              value={template.id}
              id={template.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={template.id}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
            >
              <div className="mb-2 text-primary">{template.icon}</div>
              <span className="text-sm font-medium text-center">{template.name}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedTemplate !== "none" && (
        <Card className="p-6 shadow-soft space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            {PRESET_TEMPLATES.find(t => t.id === selectedTemplate)?.icon}
            Customize Letterhead
          </h4>

          {/* Letterhead Style Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Letterhead Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { value: "banner", label: "Banner", desc: "Full-width header" },
                { value: "side-by-side", label: "Side by Side", desc: "Logo left, text right" },
                { value: "centered", label: "Centered", desc: "All centered" },
                { value: "minimal", label: "Minimal", desc: "Simple & clean" },
                { value: "classic", label: "Classic", desc: "Traditional style" },
              ].map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => handleCustomChange("letterheadStyle", style.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    customTemplate.letterheadStyle === style.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-medium block">{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Organization Logo</Label>
            <div className="flex items-center gap-4">
              {customTemplate.logo ? (
                <div className="relative">
                  <img 
                    src={customTemplate.logo} 
                    alt="Logo" 
                    className="h-16 w-auto object-contain rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Logo"}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name *</Label>
              <Input
                id="orgName"
                placeholder="Your Organization"
                value={customTemplate.organizationName}
                onChange={(e) => handleCustomChange("organizationName", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline / Motto</Label>
              <Input
                id="tagline"
                placeholder="Your tagline here"
                value={customTemplate.tagline || ""}
                onChange={(e) => handleCustomChange("tagline", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgAddress">Organization Address *</Label>
            <Textarea
              id="orgAddress"
              placeholder="Full address..."
              value={customTemplate.address}
              onChange={(e) => handleCustomChange("address", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={customTemplate.phone || ""}
                onChange={(e) => handleCustomChange("phone", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                value={customTemplate.email || ""}
                onChange={(e) => handleCustomChange("email", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="www.example.com"
                value={customTemplate.website || ""}
                onChange={(e) => handleCustomChange("website", e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Letterhead Preview:</p>
            <div className="text-center border-b-2 border-primary/30 pb-4">
              {customTemplate.logo && (
                <img 
                  src={customTemplate.logo} 
                  alt="Logo" 
                  className="h-12 w-auto mx-auto mb-2 object-contain"
                />
              )}
              <h3 className="text-lg font-bold text-primary">{customTemplate.organizationName || "Organization Name"}</h3>
              {customTemplate.tagline && (
                <p className="text-sm text-muted-foreground italic">{customTemplate.tagline}</p>
              )}
              <p className="text-xs mt-2 whitespace-pre-line">{customTemplate.address}</p>
              <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                {customTemplate.phone && <span>📞 {customTemplate.phone}</span>}
                {customTemplate.email && <span>✉️ {customTemplate.email}</span>}
                {customTemplate.website && <span>🌐 {customTemplate.website}</span>}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};