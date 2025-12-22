import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas using manual validation (Zod not available in Deno edge functions)
function validateString(value: unknown, fieldName: string, minLen = 0, maxLen = 1000): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length < minLen) {
    throw new Error(`${fieldName} must be at least ${minLen} characters`);
  }
  if (value.length > maxLen) {
    throw new Error(`${fieldName} must be at most ${maxLen} characters`);
  }
  return value;
}

function validateOptionalString(value: unknown, fieldName: string, maxLen = 1000): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return validateString(value, fieldName, 0, maxLen);
}

function validateTableData(tableData: unknown): { headers: string[]; rows: string[][] } | undefined {
  if (!tableData) return undefined;
  
  if (typeof tableData !== 'object' || tableData === null) {
    throw new Error('tableData must be an object');
  }
  
  const td = tableData as Record<string, unknown>;
  
  if (!Array.isArray(td.headers) || td.headers.length > 20) {
    throw new Error('tableData.headers must be an array with max 20 items');
  }
  
  if (!Array.isArray(td.rows) || td.rows.length > 100) {
    throw new Error('tableData.rows must be an array with max 100 items');
  }
  
  const headers = td.headers.map((h, i) => validateString(h, `tableData.headers[${i}]`, 0, 100));
  const rows = td.rows.map((row, i) => {
    if (!Array.isArray(row)) throw new Error(`tableData.rows[${i}] must be an array`);
    return row.map((cell, j) => validateString(cell, `tableData.rows[${i}][${j}]`, 0, 500));
  });
  
  return { headers, rows };
}

function validateAttachments(attachments: unknown): { name: string; type: string }[] | undefined {
  if (!attachments) return undefined;
  
  if (!Array.isArray(attachments) || attachments.length > 10) {
    throw new Error('attachments must be an array with max 10 items');
  }
  
  return attachments.map((a, i) => {
    if (typeof a !== 'object' || a === null) {
      throw new Error(`attachments[${i}] must be an object`);
    }
    const att = a as Record<string, unknown>;
    return {
      name: validateString(att.name, `attachments[${i}].name`, 1, 255),
      type: validateString(att.type, `attachments[${i}].type`, 1, 100),
    };
  });
}

function validateLetterTemplate(template: unknown): {
  organizationName: string;
  tagline?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
} | undefined {
  if (!template) return undefined;
  
  if (typeof template !== 'object' || template === null) {
    throw new Error('letterTemplate must be an object');
  }
  
  const t = template as Record<string, unknown>;
  
  return {
    organizationName: validateString(t.organizationName, 'letterTemplate.organizationName', 1, 200),
    tagline: validateOptionalString(t.tagline, 'letterTemplate.tagline', 200),
    address: validateString(t.address, 'letterTemplate.address', 1, 500),
    phone: validateOptionalString(t.phone, 'letterTemplate.phone', 50),
    email: validateOptionalString(t.email, 'letterTemplate.email', 100),
    website: validateOptionalString(t.website, 'letterTemplate.website', 200),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please log in to generate letters' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication - Please log in again' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse and validate input
    const body = await req.json();
    
    const letterType = validateString(body.letterType, 'letterType', 1, 50);
    const senderName = validateString(body.senderName, 'senderName', 1, 200);
    const recipientName = validateString(body.recipientName, 'recipientName', 1, 200);
    const subject = validateString(body.subject, 'subject', 1, 300);
    const context = validateOptionalString(body.context, 'context', 5000);
    const senderAddress = validateOptionalString(body.senderAddress, 'senderAddress', 500);
    const recipientAddress = validateOptionalString(body.recipientAddress, 'recipientAddress', 500);
    const letterDate = validateOptionalString(body.letterDate, 'letterDate', 50);
    const tableData = validateTableData(body.tableData);
    const attachments = validateAttachments(body.attachments);
    const letterTemplate = validateLetterTemplate(body.letterTemplate);

    console.log('Generating letter with params:', { 
      letterType, 
      senderName, 
      recipientName, 
      subject, 
      letterDate, 
      hasTable: !!tableData, 
      attachmentsCount: attachments?.length || 0, 
      hasTemplate: !!letterTemplate,
      userId: user.id
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Format table data if provided
    let tableSection = '';
    if (tableData && tableData.headers && tableData.rows) {
      const headerRow = tableData.headers.join(' | ');
      const separator = tableData.headers.map(() => '---').join(' | ');
      tableSection = `

Include the following table in the letter body at an appropriate location:

| ${headerRow} |
| ${separator} |
${tableData.rows.map((row: string[]) => `| ${row.join(' | ')} |`).join('\n')}

Format this table neatly in the letter using ASCII table formatting with proper alignment.`;
    }

    // Format attachments info if provided
    let attachmentsSection = '';
    if (attachments && attachments.length > 0) {
      const attachmentsList = attachments.map((a: { name: string; type: string }) => `- ${a.name}`).join('\n');
      attachmentsSection = `

The letter should mention that the following documents are attached:
${attachmentsList}

Include an "Enclosures:" or "Attachments:" section at the end of the letter listing these files.`;
    }

    // Format letterhead template if provided
    let letterheadSection = '';
    if (letterTemplate && letterTemplate.organizationName) {
      letterheadSection = `

IMPORTANT: This letter must include a professional letterhead at the very top. Format the letterhead as follows:

================================================================================
                        ${letterTemplate.organizationName.toUpperCase()}
${letterTemplate.tagline ? `                        "${letterTemplate.tagline}"` : ''}

${letterTemplate.address}
${letterTemplate.phone ? `Phone: ${letterTemplate.phone}` : ''}${letterTemplate.email ? `  |  Email: ${letterTemplate.email}` : ''}${letterTemplate.website ? `  |  Web: ${letterTemplate.website}` : ''}
================================================================================

The letterhead should be centered and visually distinct from the rest of the letter. Include a separator line after the letterhead before the date.`;
    }

    // Create a comprehensive prompt for the AI
    const prompt = `You are a professional letter writing expert. Generate a formal, error-free, professional letter with the following details:

Letter Type: ${letterType}
Date: ${letterDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Sender: ${senderName}${senderAddress ? `\nSender Address: ${senderAddress}` : ''}
Recipient: ${recipientName}${recipientAddress ? `\nRecipient Address: ${recipientAddress}` : ''}
Subject: ${subject}
${context ? `Additional Context: ${context}` : ''}${tableSection}${attachmentsSection}${letterheadSection}

Requirements:
1. Use proper business letter format with appropriate salutations and closings
2. Include the specified date (${letterDate}) at the top of the letter
3. Make it professional, clear, and concise
4. Ensure perfect grammar, spelling, and punctuation
5. Use appropriate tone for the letter type
6. Include all provided addresses in proper format
7. Make the content relevant and specific to the subject
8. Keep paragraphs well-structured
9. End with an appropriate closing statement

Generate ONLY the letter content without any additional explanations or meta-commentary. The letter should be ready to print and send.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert professional letter writer. You create perfectly formatted, error-free letters for any purpose. You always follow proper business letter conventions and adapt your tone to match the letter type.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generatedLetter = data.choices?.[0]?.message?.content;

    if (!generatedLetter) {
      throw new Error('No letter content generated');
    }

    console.log('Letter generated successfully for user:', user.id);

    return new Response(
      JSON.stringify({ letter: generatedLetter }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-letter function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
