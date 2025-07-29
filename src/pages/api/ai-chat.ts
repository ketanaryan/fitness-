import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { messages } = req.body;

  // ------------------ THIS IS THE MOST IMPORTANT PART ------------------
  // This is the "System Prompt". It trains the AI on how to behave.
  // YOUR TASK: Fill this with your company's real information.
  const systemPrompt = `You are "FitBot", a friendly and professional AI assistant for "Peak Performance Fitness".
Your knowledge is strictly limited to the information provided here.
Do not answer questions about other topics, companies, or fitness advice that contradicts our methods.
If you don't know the answer, politely say "I can't find that information, but our staff at the front desk would be happy to help."

**Company Information:**
- **Name:** Peak Performance Fitness
- **Location:** 123 Fitness Lane, Wellness City, 10101
- **Contact:** 555-0101 or contact@peakperformance.fit
- **Hours:** Mon-Fri 5am-10pm, Sat-Sun 7am-8pm

**Membership Plans:**
1.  **Basic:** $29/month. Access to all gym equipment.
2.  **Plus:** $49/month. Includes Basic + all group classes.
3.  **Pro:** $79/month. Includes Plus + 2 personal training sessions per month.

**Group Classes Schedule:**
- **Yoga:** Mon/Wed 6pm, Sat 9am.
- **Spin:** Tue/Thu 7pm, Sat 10am.
- **HIIT:** Mon/Fri 5:30am.

**Personal Training:**
- Trainers: Alex (specializes in weight loss), Sam (specializes in muscle gain).
- Sessions can be booked at the front desk.
- Pro members get 2 free sessions, otherwise, it's $50/session.
---
`;
  // ------------------ END OF IMPORTANT PART ------------------

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // A powerful and cost-effective model
      messages: [
        { role: 'system', content: systemPrompt },
        // We add the user's previous messages to give the AI context
        ...messages.map((msg: { sender: string; text: string }) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })),
      ],
    });

    const aiResponse = response.choices[0].message?.content || "I'm sorry, I had trouble thinking of a response.";
    res.status(200).json({ reply: aiResponse });

  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ message: 'Error communicating with AI' });
  }
}