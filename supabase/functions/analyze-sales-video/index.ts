import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { salesperson, product, objective, videoBase64, mimeType } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    if (!videoBase64 || !mimeType) {
      throw new Error('Dados do vídeo não fornecidos');
    }

    console.log('Iniciando transcrição do vídeo...');

    // Step 1: Transcribe the video using Gemini
    const transcriptionPrompt = `Por favor, transcreva completamente o áudio deste vídeo de vendas. 
    
Inclua:
1. Todo o diálogo falado, palavra por palavra
2. Pausas significativas (indicar com [...])
3. Tom emocional quando perceptível (ex: [empolgado], [confiante], [hesitante])
4. Descrição breve de elementos visuais importantes que complementam a fala

Formate a transcrição de forma clara e sequencial.`;

    const transcriptionResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: transcriptionPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: videoBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
          }
        }),
      }
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Erro na transcrição:', transcriptionResponse.status, errorText);
      
      if (transcriptionResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de taxa excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (transcriptionResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Chave da API inválida.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (transcriptionResponse.status === 400) {
        let errorDetails = 'Formato de vídeo não suportado ou vídeo muito grande.';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error && errorJson.error.message) {
            errorDetails = errorJson.error.message;
          }
        } catch (e) { /* Ignora se o erro não for JSON */ }
        return new Response(
          JSON.stringify({ error: errorDetails }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Erro ao transcrever vídeo: ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    
    // *** LÓGICA DE SEGURANÇA CORRIGIDA ***
    if (!transcriptionData.candidates || transcriptionData.candidates.length === 0) {
      console.error('Resposta inesperada da API (sem candidates):', JSON.stringify(transcriptionData, null, 2));
      throw new Error('Formato de resposta inesperado da API de transcrição.');
    }

    const transcriptionCandidate = transcriptionData.candidates[0];

    // Checa se a transcrição foi interrompida por algum motivo (SEGURANÇA, etc)
    if (transcriptionCandidate.finishReason && transcriptionCandidate.finishReason !== 'STOP') {
      const reason = transcriptionCandidate.finishReason;
      console.error(`Transcrição falhou. Motivo: ${reason}`);
      return new Response(
        JSON.stringify({ error: `O vídeo foi bloqueado pela API. Motivo: ${reason}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Agora sim, podemos checar o conteúdo com segurança
    if (!transcriptionCandidate.content || !transcriptionCandidate.content.parts || !transcriptionCandidate.content.parts[0] || !transcriptionCandidate.content.parts[0].text) {
      console.error('Resposta inesperada da API (formato de conteúdo inválido):', JSON.stringify(transcriptionData, null, 2));
      throw new Error('Formato de resposta inesperado da API de transcrição.');
    }
    // *** FIM DA LÓGICA CORRIGIDA ***

    const transcript = transcriptionCandidate.content.parts[0].text;

    console.log('Transcrição concluída. Iniciando análise...');

    const systemPrompt = `Você é um "Analista de Performance de Vendas IA", um especialista sênior em coaching de vendas para a indústria farmacêutica. Sua especialidade é analisar roteiros e abordagens de comunicação em vídeo. Seu tom é profissional, analítico, objetivo e, acima de tudo, construtivo.

PROCESSO DE ANÁLISE:
1. Avalie a transcrição sequencialmente com base no modelo AIDA (Atenção, Interesse, Desejo, Ação)
2. Avalie critérios comportamentais
3. Atribua pontuação de 1 (fraco) a 5 (excelente) para cada critério
4. Forneça feedback específico com exemplos da transcrição

CRITÉRIOS DE AVALIAÇÃO:

**Modelo AIDA:**
- Atenção (1-5): Abertura impactante, conexão inicial
- Interesse (1-5): Apresentação de benefícios, engajamento
- Desejo (1-5): Criação de valor, diferenciação
- Ação (1-5): Call-to-action claro, próximos passos

**Critérios Comportamentais:**
- Clareza da Comunicação (1-5)
- Conexão Emocional (1-5)
- Conhecimento do Produto (1-5)
- Tratamento de Objeções (1-5): (Se não houver objeções, avalie como N/A ou 5, mas mencione)
- Linguagem Corporal/Confiança (1-5): (Inferir do tom e pausas na transcrição)
- Personalização (1-5): (Se a transcrição menciona o nome do cliente/médico ou problemas específicos)

FORMATO DO RELATÓRIO:

# RELATÓRIO DE ANÁLISE DE PERFORMANCE DE VENDAS

## Informações do Vídeo
- Vendedor: [nome]
- Produto/Tema: [produto]
- Objetivo: [objetivo]

## Nota Geral: X.X/5.0
(Calcule a média de todas as pontuações dadas)

## Análise AIDA

### Atenção (X/5)
[Análise detalhada com exemplos da transcrição]

### Interesse (X/5)
[Análise detalhada com exemplos da transcrição]

### Desejo (X/5)
[Análise detalhada com exemplos da transcrição]

### Ação (X/5)
[Análise detalhada com exemplos da transcrição]

## Avaliação Comportamental

### Clareza da Comunicação (X/5)
[Análise com exemplos]

### Conexão Emocional (X/5)
[Análise com exemplos]

### Conhecimento do Produto (X/5)
[Análise com exemplos]

### Tratamento de Objeções (X/5)
[Análise com exemplos]

### Linguagem Corporal/Confiança (X/5)
[Inferências baseadas na transcrição]

### Personalização (X/5)
[Análise com exemplos]

## Pontos Fortes
[Lista específica de 2-3 pontos fortes com citações da transcrição]

## Pontos de Melhoria
[Lista específica de 2-3 melhorias necessárias com exemplos concretos e acionáveis]

## Recomendações Práticas
[3 recomendações imediatamente aplicáveis]

IMPORTANTE: Seja específico, baseado em evidências da transcrição, e foque em feedback acionável.`;

    // Step 2: Analyze the transcript
    const userPrompt = `Por favor, analise o seguinte vídeo de vendas:

Vendedor: ${salesperson}
Produto/Tema: ${product}
Objetivo: ${objective}

Transcrição:
---
${transcript}
---
`;

    const analysisResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      { // <-- Erro 'm {' corrigido
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt }
              ]
            },
            {
              role: "model",
              parts: [
                { text: "Entendido. Estou pronto para analisar a transcrição. Por favor, forneça os detalhes e a transcrição." }
              ]
            },
            {
              role: "user",
              parts: [
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000, // <-- Erro 'a ' corrigido
            responseMimeType: "text/plain", 
          }
        }),
      }
    );

    if (!analysisResponse.ok) {
        // Adiciona log de erro para a análise também
      const errorText = await analysisResponse.text();
      console.error('Erro da API Gemini na análise:', analysisResponse.status, errorText);

      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de taxa excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (analysisResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Chave da API inválida.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Erro ao processar análise: ${errorText}`);
    }

    const analysisData = await analysisResponse.json();

    // *** LÓGICA DE SEGURANÇA CORRIGIDA (para a Análise) ***
    if (!analysisData.candidates || analysisData.candidates.length === 0) {
      console.error('Resposta inesperada da API de análise (sem candidates):', JSON.stringify(analysisData, null, 2));
      throw new Error('Formato de resposta inesperado da API de análise.');
    }
    
    const analysisCandidate = analysisData.candidates[0];

    if (analysisCandidate.finishReason && analysisCandidate.finishReason !== 'STOP') {
      const reason = analysisCandidate.finishReason;
      console.error(`Análise falhou. Motivo: ${reason}`);
      return new Response(
        JSON.stringify({ error: `A análise foi bloqueada pela API. Motivo: ${reason}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!analysisCandidate.content || !analysisCandidate.content.parts || !analysisCandidate.content.parts[0] || !analysisCandidate.content.parts[0].text) {
      console.error('Resposta inesperada da API de análise (formato de conteúdo inválido):', JSON.stringify(analysisData, null, 2));
      throw new Error('Formato de resposta inesperado da API de análise.');
    }
    // *** FIM DA LÓGICA CORRIGIDA ***

    const analysis = analysisCandidate.content.parts[0].text;

    console.log('Análise concluída com sucesso.');

    return new Response(
      JSON.stringify({ analysis, transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função analyze-sales-video:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // <-- Erro 'bu' corrigido
    );
  }
});