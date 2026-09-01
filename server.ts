import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK safely (Application Default Credentials / Cloud Project ID)
if (!getApps().length) {
  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        projectId = config.projectId;
      }
    } catch {
      // Fallback to default credentials
    }
  }

  initializeApp(projectId ? { projectId } : {});
}

// Authenticated Request Interface
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

// Reusable Authentication Middleware verifying Firebase ID token
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
    });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.warn('Firebase ID token verification failed:', error?.code || 'INVALID_TOKEN');
    return res.status(401).json({
      error: 'Your session has expired. Please sign in again.',
    });
  }
}

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured in the environment.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

async function generateWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseSchema?: any;
  responseMimeType?: string;
}) {
  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_LADDER) {
    try {
      const config: any = {};
      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config,
      });

      return {
        text: response.text || '',
        modelUsed: modelName,
      };
    } catch (err: any) {
      console.warn(`Attempt with model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All fallback models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

const WELLBEING_SYSTEM_INSTRUCTION = `You are a supportive, insightful, and non-judgmental Wellbeing & Reflection Companion.
CRITICAL SAFETY, PRIVACY, AND NON-CLINICAL DIRECTIVES:
1. NON-CLINICAL ROLE: You are a reflective companion, NOT a therapist, doctor, counselor, clinical psychologist, or medical emergency service.
2. NO DIAGNOSES OR MEDICAL ADVICE: Never diagnose mental health conditions, personality traits, or medical disorders. Never infer clinical conditions from writing style, journal history, mood, or location.
3. NO TREATMENT OR MEDICATION GUIDANCE: Never prescribe medication, recommend medical treatments, or suggest starting, stopping, or modifying prescribed treatments.
4. TENTATIVE & GROUNDED INQUIRY: Do not claim to understand the user's mental state with certainty. Use tentative language such as "you mentioned", "it sounds like", "you might consider", or "if it feels helpful". Ground all reflections solely in the explicit thoughts and experiences the user actually provided in this entry.
5. CONCISE & PRACTICAL: Keep responses warm, supportive, concise, non-judgmental, and focused on gentle reflection, self-understanding, and coping ideas.
6. CRISIS AND IMMINENT HARM DIRECTIVE: If the user expresses imminent intent or thoughts of self-harm, suicide, or harming others:
   - Stop normal reflective or analytical journaling exercises immediately.
   - Prioritize immediate safety and well-being above all else.
   - Compassionately and directly encourage contacting local emergency services (such as emergency medical or crisis responders in their area) or speaking with a trusted person, family member, or healthcare professional who can stay with and support them.
   - If providing crisis resources, do not assume any specific country. Suggest connecting with local emergency numbers, local crisis helplines, or finding verified global resources via https://findahelpline.com or https://befrienders.org. Only reference regional numbers if the user has explicitly stated their specific country in their message. Never use optional journal location tags or coordinates to infer country for crisis guidance.
   - Avoid lengthy intellectual reflections that could delay urgent real-world care.
   - Do NOT treat normal daily stress, sadness, frustration, or grief as an emergency unless there is clear imminent danger.
7. PRIVACY: Treat all journal entries and conversation messages as strictly confidential private reflections. Only analyze the specific content provided in this session.`;

const WELLBEING_COMPANION_SYSTEM_INSTRUCTION = `You are the Wellbeing Companion, a dedicated, supportive, and non-judgmental conversational partner designed exclusively for personal reflection, exploring feelings, thinking through life experiences, and considering gentle self-care or coping steps.

CRITICAL SCOPE & ANTI-GENERAL-PURPOSE AI DIRECTIVE:
1. EXCLUSIVE PURPOSE: This space is designed strictly for personal reflection and wellbeing conversation. You are NOT a general-purpose AI assistant (such as ChatGPT), coding assistant, search engine, trivia provider, homework solver, or business copywriter.
2. HANDLING OFF-TOPIC QUESTIONS: If the user asks for coding/programming tasks, trivia, homework/math solutions, factual research, marketing copy, or other unrelated general-purpose requests:
   - Politely decline.
   - Warmly explain: "This space is dedicated exclusively to personal reflection, exploring feelings, and talking through your thoughts and experiences. I am not able to assist with coding, trivia, or homework tasks, but I would be glad to help you explore what is on your mind or how you are feeling today."
   - Gently invite them to share how they are doing or what they'd like to reflect on.

CRITICAL NON-CLINICAL & SAFETY DIRECTIVES:
3. NON-CLINICAL ROLE: You are a reflective companion, NOT a therapist, psychologist, psychiatrist, medical doctor, counselor, or emergency service.
4. NO DIAGNOSES OR TREATMENT: Do not diagnose mental health conditions, psychiatric disorders, or medical issues. Do not recommend starting, stopping, or altering prescribed medications or clinical treatments.
5. TENTATIVE & REFLECTIVE INQUIRY: Help the user express what is on their mind, unpack feelings, think through situations, and explore gentle next steps. Usually reflect, clarify, validate, and ask thoughtful open-ended questions rather than immediately trying to solve or fix every problem. Use tentative language ("you mentioned", "it sounds like", "how does that feel?", "if it feels helpful, you might consider").
6. CRISIS AND IMMINENT HARM DIRECTIVE: If the user expresses imminent thoughts or intent of self-harm, suicide, or violence toward others:
   - Stop normal reflections immediately.
   - Prioritize their immediate safety and well-being above all else.
   - Compassionately encourage contacting local emergency services (such as emergency medical or crisis responders in their area) or speaking with a trusted friend, family member, or healthcare professional who can stay with them.
   - If mentioning resources, do not assume any country. Suggest connecting with local emergency numbers, local crisis lines, or finding verified global resources via https://findahelpline.com or https://befrienders.org. Only reference regional numbers if the user has explicitly stated their specific country in their message.
   - Do NOT treat normal daily stress, sadness, frustration, or grief as an emergency unless there is clear imminent danger.
7. PRIVACY & CONTEXT ISOLATION: Treat this conversation as private. Only analyze the messages explicitly exchanged in this conversation session.`;

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint: Generate Reflection Compass
app.post('/api/gemini/compass', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const journalContent = typeof data.journalContent === 'string' ? data.journalContent.trim() : '';

    if (!journalContent) {
      return res.status(400).json({ error: 'journalContent is required' });
    }

    const compassSchema = {
      type: Type.OBJECT,
      properties: {
        whatExplored: {
          type: Type.STRING,
          description: 'What I explored: A concise 1-2 sentence summary of what the user explored in this specific entry.'
        },
        keyIdeas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key ideas: 3-4 core takeaways, themes, or insights from this entry.'
        },
        thingsToRevisit: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Things I may want to revisit: 2-3 topics, thoughts, or questions to revisit later.'
        },
        possibleNextActions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Possible next actions: 2-4 gentle, practical, self-directed next steps or experiments.'
        },
        reflectionQuestion: {
          type: Type.STRING,
          description: 'One reflection question: A single open-ended, non-clinical reflective inquiry to deepen perspective.'
        }
      },
      required: ['whatExplored', 'keyIdeas', 'thingsToRevisit', 'possibleNextActions', 'reflectionQuestion']
    };

    const prompt = `Analyze ONLY the following single private journal entry and generate a structured Reflection Compass. Do NOT provide clinical, diagnostic, or medical assessment.
Journal Entry Content:
"""
${journalContent}
"""`;

    const result = await generateWithFallback({
      contents: prompt,
      systemInstruction: WELLBEING_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: compassSchema,
    });

    const parsedData = JSON.parse(result.text);
    return res.json({
      compass: parsedData,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Compass generation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate reflection compass',
    });
  }
});

// Endpoint: Multi-turn chat & Wellbeing Companion reflections
app.post('/api/gemini/reflect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const journalContent = typeof data.journalContent === 'string' ? data.journalContent.trim() : '';
    const userPrompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
    const mode = typeof data.mode === 'string' ? data.mode : 'reflect';
    const conversationHistory = Array.isArray(data.conversationHistory) ? data.conversationHistory : [];

    if (!journalContent && !userPrompt) {
      return res.status(400).json({ error: 'Either journalContent or prompt is required' });
    }

    let contentsPayload: any;

    if (conversationHistory.length > 0) {
      // Multi-turn conversation format
      contentsPayload = [
        {
          role: 'user',
          parts: [{ text: `Here is the current journal entry for context:\n"""\n${journalContent}\n"""` }]
        },
        {
          role: 'model',
          parts: [{ text: "I have read your journal entry. I'm here as your supportive, non-clinical wellbeing reflection companion." }]
        },
        ...conversationHistory.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || '' }]
        })),
        {
          role: 'user',
          parts: [{ text: userPrompt || 'Please share your thoughts on this journal entry.' }]
        }
      ];
    } else {
      let promptText = '';
      if (mode === 'unpack') {
        promptText = `Please help me unpack the thoughts, core feelings, and concerns I explicitly expressed in this journal entry in a supportive, concise, and non-clinical way:\n\n"""\n${journalContent}\n"""`;
      } else if (mode === 'reflect_on') {
        promptText = `Based strictly on what I wrote in this journal entry, what are 2-3 thoughtful, open-ended questions or perspectives I might reflect on to explore this experience further?\n\n"""\n${journalContent}\n"""`;
      } else if (mode === 'next_step') {
        promptText = `Based on what I shared in this entry, what are 1-2 gentle, practical, low-pressure next steps or coping ideas I might consider exploring?\n\n"""\n${journalContent}\n"""`;
      } else if (mode === 'summarize') {
        promptText = `Please provide a clear, supportive summary of the following journal entry, highlighting key themes and stated feelings:\n\n"""\n${journalContent}\n"""`;
      } else if (mode === 'brainstorm') {
        promptText = `Based on the following journal entry, brainstorm 3-4 creative perspectives, gentle next steps, or ideas:\n\n"""\n${journalContent}\n"""`;
      } else if (mode === 'deepen') {
        promptText = `Based on the following journal entry, offer a thoughtful reflection and ask 2 gentle questions to help explore this further:\n\n"""\n${journalContent}\n"""`;
      } else {
        promptText = userPrompt 
          ? `Journal Entry Context:\n"""\n${journalContent}\n"""\n\nUser Question/Reflection:\n${userPrompt}`
          : `Please share a supportive, empathetic, and constructive reflection on this journal entry, highlighting areas of personal insight and offering a gentle question to consider:\n\n"""\n${journalContent}\n"""`;
      }

      contentsPayload = promptText;
    }

    const result = await generateWithFallback({
      contents: contentsPayload,
      systemInstruction: WELLBEING_SYSTEM_INSTRUCTION,
    });

    return res.json({
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Reflection error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate reflection',
    });
  }
});

// Endpoint: Dedicated Wellbeing Companion (Context-Isolated Conversational Space)
app.post('/api/gemini/companion', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const userPrompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
    const mode = typeof data.mode === 'string' ? data.mode : '';
    const conversationHistory = Array.isArray(data.conversationHistory) ? data.conversationHistory : [];

    if (!userPrompt && !mode && conversationHistory.length === 0) {
      return res.status(400).json({ error: 'A prompt, mode, or conversation history is required.' });
    }

    let contentsPayload: any;

    if (conversationHistory.length > 0) {
      const partsHistory = conversationHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || '' }],
      }));

      if (userPrompt) {
        partsHistory.push({
          role: 'user',
          parts: [{ text: userPrompt }],
        });
      } else if (mode) {
        let actionPrompt = '';
        if (mode === 'unpack') {
          actionPrompt = 'Help me unpack what I just shared in a supportive, concise, and non-clinical way.';
        } else if (mode === 'reflect_on') {
          actionPrompt = 'Based on what I just shared, what are 2-3 thoughtful, open-ended questions I might reflect on to explore this further?';
        } else if (mode === 'next_step') {
          actionPrompt = 'Based on what I shared, what are 1-2 gentle, practical, low-pressure next steps or coping ideas I might consider exploring?';
        } else {
          actionPrompt = 'Please share a supportive, thoughtful reflection on our conversation.';
        }

        partsHistory.push({
          role: 'user',
          parts: [{ text: actionPrompt }],
        });
      }

      contentsPayload = partsHistory;
    } else {
      let promptText = userPrompt;
      if (!promptText && mode) {
        if (mode === 'unpack') {
          promptText = 'Help me unpack what is on my mind today in a supportive, gentle, and non-clinical way.';
        } else if (mode === 'reflect_on') {
          promptText = 'What are 2-3 thoughtful, open-ended questions I might reflect on today?';
        } else if (mode === 'next_step') {
          promptText = 'Help me think of a gentle, low-pressure next step for self-care or personal reflection.';
        } else {
          promptText = 'Hello, I am looking for a supportive space to reflect on what is on my mind.';
        }
      }
      contentsPayload = promptText || 'Hello, I would like to reflect on my day.';
    }

    const result = await generateWithFallback({
      contents: contentsPayload,
      systemInstruction: WELLBEING_COMPANION_SYSTEM_INSTRUCTION,
    });

    return res.json({
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Wellbeing Companion error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate companion response',
    });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini Journal Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
