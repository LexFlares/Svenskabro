import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const audioData = req.body;

    const transcription = await transcribeAudio(audioData);

    return res.status(200).json({
      text: transcription,
      language: 'sv-SE',
      confidence: 0.95,
      duration: 3.5
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}

async function transcribeAudio(audioData: any): Promise<string> {
  return 'Detta är en simulerad transkribering av röstinspelningen. I produktion skulle detta använda Whisper API eller liknande tjänst för att konvertera tal till text med hög noggrannhet på svenska.';
}
