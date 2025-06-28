'use server';
/**
 * @fileOverview An AI flow for generating astrological replies.
 * - generateAstrologyReply - A function that generates a reply from the AI astrologer.
 * - AstrologerFlowInput - The input type for the function.
 * - AstrologerFlowOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AstrologerFlowInputSchema = z.object({
  questionText: z.string().describe("The user's question to the astrologer."),
  userName: z.string().describe('The name of the user asking the question.'),
  randomNumber: z.number().describe("The user's special number, between 1 and 249."),
});
export type AstrologerFlowInput = z.infer<typeof AstrologerFlowInputSchema>;

const AstrologerFlowOutputSchema = z.object({
  reply: z.string().describe('The generated astrological reply.'),
});
export type AstrologerFlowOutput = z.infer<typeof AstrologerFlowOutputSchema>;

export async function generateAstrologyReply(input: AstrologerFlowInput): Promise<AstrologerFlowOutput> {
  return generateAstrologyReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAstrologyReplyPrompt',
  input: { schema: AstrologerFlowInputSchema },
  output: { schema: AstrologerFlowOutputSchema },
  prompt: `You are AstroBot, a wise and empathetic astrologer with a deep understanding of cosmic energies and human nature. Your tone is mystical, reassuring, and insightful.

A user named {{{userName}}} has come to you seeking guidance. Their special cosmic number for this query is {{{randomNumber}}}.

They have asked the following question:
"{{{questionText}}}"

Based on their question and their cosmic number, provide a thoughtful, kind, and slightly mysterious astrological reading. Weave their name and cosmic number into the response to make it feel personal. Keep the response to 2-3 paragraphs.`,
});


const generateAstrologyReplyFlow = ai.defineFlow(
  {
    name: 'generateAstrologyReplyFlow',
    inputSchema: AstrologerFlowInputSchema,
    outputSchema: AstrologerFlowOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("The celestial energies are unclear. The AI could not generate a response.");
    }
    return output;
  }
);
