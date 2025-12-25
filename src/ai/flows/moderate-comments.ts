// src/ai/flows/moderate-comments.ts
'use server';

/**
 * @fileOverview This file implements a Genkit flow for moderating comments.
 *
 * The flow uses AI to detect offensive or off-topic comments and prevent them from being displayed.
 *
 * @exports moderateComment - A function to moderate a comment.
 * @exports ModerateCommentInput - The input type for the moderateComment function.
 * @exports ModerateCommentOutput - The output type for the moderateComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateCommentInputSchema = z.object({
  comment: z
    .string()
    .describe('The comment to be moderated.'),
});
export type ModerateCommentInput = z.infer<typeof ModerateCommentInputSchema>;

const ModerateCommentOutputSchema = z.object({
  isSafe: z
    .boolean()
    .describe(
      'True if the comment is safe and appropriate, false otherwise.'
    ),
  reason: z
    .string()
    .optional()
    .describe(
      'The reason why the comment was flagged as unsafe, if applicable.'
    ),
});
export type ModerateCommentOutput = z.infer<typeof ModerateCommentOutputSchema>;

export async function moderateComment(
  input: ModerateCommentInput
): Promise<ModerateCommentOutput> {
  return moderateCommentFlow(input);
}

const moderateCommentPrompt = ai.definePrompt({
  name: 'moderateCommentPrompt',
  input: {schema: ModerateCommentInputSchema},
  output: {schema: ModerateCommentOutputSchema},
  prompt: `You are a content moderator for a platinum trophy screenshot website.
  Your job is to determine if a comment is safe and appropriate to be displayed below the image.

  Here are the requirements for a safe comment:
  - Must be related to the image and not be off-topic
  - Must not contain any offensive language, hate speech, or personal attacks.

  Here is the comment to be evaluated:
  {{comment}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const moderateCommentFlow = ai.defineFlow(
  {
    name: 'moderateCommentFlow',
    inputSchema: ModerateCommentInputSchema,
    outputSchema: ModerateCommentOutputSchema,
  },
  async input => {
    const {output} = await moderateCommentPrompt(input);
    return output!;
  }
);

