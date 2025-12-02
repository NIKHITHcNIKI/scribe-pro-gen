import { Phone, Mail, Globe } from "lucide-react";
import { LetterTemplate } from "./LetterTemplates";

interface LetterheadRendererProps {
  template: LetterTemplate;
  isEditing?: boolean;
  onTemplateChange?: (template: LetterTemplate) => void;
}

export const LetterheadRenderer = ({ template, isEditing, onTemplateChange }: LetterheadRendererProps) => {
  const handleChange = (field: keyof LetterTemplate, value: string) => {
    if (onTemplateChange) {
      onTemplateChange({ ...template, [field]: value });
    }
  };

  const EditableText = ({ 
    value, 
    field, 
    className = "",
    placeholder = ""
  }: { 
    value: string; 
    field: keyof LetterTemplate; 
    className?: string;
    placeholder?: string;
  }) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(field, e.target.value)}
          className={`bg-transparent border-b border-dashed border-current/50 focus:border-current outline-none ${className}`}
          placeholder={placeholder}
        />
      );
    }
    return <span className={className}>{value}</span>;
  };

  const ContactInfo = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${className}`}>
      {(template.phone || isEditing) && (
        <span className="flex items-center gap-1 opacity-90">
          <Phone className="w-3 h-3" />
          <EditableText value={template.phone || ""} field="phone" placeholder="Phone" />
        </span>
      )}
      {(template.email || isEditing) && (
        <span className="flex items-center gap-1 opacity-90">
          <Mail className="w-3 h-3" />
          <EditableText value={template.email || ""} field="email" placeholder="Email" />
        </span>
      )}
      {(template.website || isEditing) && (
        <span className="flex items-center gap-1 opacity-90">
          <Globe className="w-3 h-3" />
          <EditableText value={template.website || ""} field="website" placeholder="Website" />
        </span>
      )}
    </div>
  );

  // Banner Style - Full width gradient header
  if (template.letterheadStyle === "banner") {
    return (
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="px-8 py-6">
          <div className="flex items-center gap-6">
            {template.logo && (
              <div className="flex-shrink-0">
                <img 
                  src={template.logo} 
                  alt={template.organizationName}
                  className="h-20 w-auto object-contain bg-white/10 rounded-lg p-2"
                />
              </div>
            )}
            <div className="flex-1 text-center">
              {(template.tagline || isEditing) && (
                <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
                  <EditableText value={template.tagline || ""} field="tagline" placeholder="Tagline" />
                </p>
              )}
              <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
                <EditableText value={template.organizationName} field="organizationName" placeholder="Organization Name" />
              </h2>
            </div>
            {template.logo && <div className="w-20 flex-shrink-0" />}
          </div>
        </div>
        <div className="bg-primary-foreground/10 px-8 py-3">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs md:text-sm">
            {(template.address || isEditing) && (
              <span className="opacity-90">
                {isEditing ? (
                  <input
                    type="text"
                    value={template.address.split('\n').join(' • ')}
                    onChange={(e) => handleChange("address", e.target.value.split(' • ').join('\n'))}
                    className="bg-transparent border-b border-dashed border-current/50 focus:border-current outline-none min-w-[200px]"
                    placeholder="Address"
                  />
                ) : (
                  template.address.split('\n').join(' • ')
                )}
              </span>
            )}
          </div>
          <div className="flex justify-center mt-2">
            <ContactInfo />
          </div>
        </div>
      </div>
    );
  }

  // Side by Side Style - Logo left, text right
  if (template.letterheadStyle === "side-by-side") {
    return (
      <div className="border-b-4 border-primary">
        <div className="px-8 py-6 flex items-center gap-6">
          {template.logo && (
            <div className="flex-shrink-0">
              <img 
                src={template.logo} 
                alt={template.organizationName}
                className="h-24 w-auto object-contain"
              />
            </div>
          )}
          <div className="flex-1 border-l-2 border-primary/30 pl-6">
            <h2 className="text-2xl font-bold text-primary">
              <EditableText value={template.organizationName} field="organizationName" placeholder="Organization Name" />
            </h2>
            {(template.tagline || isEditing) && (
              <p className="text-sm text-muted-foreground italic">
                <EditableText value={template.tagline || ""} field="tagline" placeholder="Tagline" />
              </p>
            )}
            {(template.address || isEditing) && (
              <p className="text-xs text-muted-foreground mt-2">
                <EditableText value={template.address.split('\n').join(' | ')} field="address" placeholder="Address" />
              </p>
            )}
            <ContactInfo className="mt-2 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Centered Style - Everything centered
  if (template.letterheadStyle === "centered") {
    return (
      <div className="border-b-2 border-primary/20">
        <div className="px-8 py-8 text-center">
          {template.logo && (
            <div className="flex justify-center mb-4">
              <img 
                src={template.logo} 
                alt={template.organizationName}
                className="h-20 w-auto object-contain"
              />
            </div>
          )}
          <h2 className="text-3xl font-bold text-primary tracking-wide">
            <EditableText value={template.organizationName} field="organizationName" placeholder="Organization Name" />
          </h2>
          {(template.tagline || isEditing) && (
            <p className="text-sm text-muted-foreground mt-1 italic">
              <EditableText value={template.tagline || ""} field="tagline" placeholder="Tagline" />
            </p>
          )}
          {(template.address || isEditing) && (
            <p className="text-xs text-muted-foreground mt-3">
              <EditableText value={template.address.split('\n').join(' • ')} field="address" placeholder="Address" />
            </p>
          )}
          <div className="flex justify-center mt-2">
            <ContactInfo className="text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Minimal Style - Clean and simple
  if (template.letterheadStyle === "minimal") {
    return (
      <div className="border-b border-border">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {template.logo && (
              <img 
                src={template.logo} 
                alt={template.organizationName}
                className="h-10 w-auto object-contain"
              />
            )}
            <h2 className="text-xl font-semibold text-foreground">
              <EditableText value={template.organizationName} field="organizationName" placeholder="Organization Name" />
            </h2>
          </div>
          <ContactInfo className="text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Classic Style - Traditional formal letterhead
  if (template.letterheadStyle === "classic") {
    return (
      <div className="border-b-2 border-double border-primary/40">
        <div className="px-8 py-6">
          <div className="flex items-start gap-6">
            {template.logo && (
              <div className="flex-shrink-0">
                <img 
                  src={template.logo} 
                  alt={template.organizationName}
                  className="h-16 w-auto object-contain grayscale opacity-80"
                />
              </div>
            )}
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-serif font-bold text-primary tracking-widest uppercase">
                <EditableText value={template.organizationName} field="organizationName" placeholder="Organization Name" />
              </h2>
              {(template.tagline || isEditing) && (
                <p className="text-sm text-muted-foreground mt-1 font-serif italic">
                  <EditableText value={template.tagline || ""} field="tagline" placeholder="Tagline" />
                </p>
              )}
              <div className="w-24 h-0.5 bg-primary/30 mx-auto mt-3" />
              {(template.address || isEditing) && (
                <p className="text-xs text-muted-foreground mt-3 font-serif">
                  <EditableText value={template.address.split('\n').join(' | ')} field="address" placeholder="Address" />
                </p>
              )}
              <ContactInfo className="mt-2 justify-center text-muted-foreground font-serif" />
            </div>
            {template.logo && <div className="w-16 flex-shrink-0" />}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
