import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { letterType, senderName, senderAddress, recipientName, recipientAddress, subject, context, letterDate, tableData, attachments, letterTemplate } = await req.json();

    console.log('Generating letter with params:', { letterType, senderName, recipientName, subject, letterDate, hasTable: !!tableData, attachmentsCount: attachments?.length || 0, hasTemplate: !!letterTemplate });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Format table data if provided
    let tableSection = '';
    if (tableData && tableData.headers && tableData.rows) {
      const headerRow = tableData.headers.join(' | ');
      const separator = tableData.headers.map(() => '---').join(' | ');
      const dataRows = tableData.rows.map((row: string[]) => row.join(' | ')).join('\n');
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

    console.log('Letter generated successfully');

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
