'use server';
/**
 * @fileOverview An AI agent for suggesting potential friends to a user.
 *
 * - suggestFriends - A function that suggests friends based on user profile and activity.
 * - SuggestFriendsInput - The input type for the suggestFriends function.
 * - SuggestFriendsOutput - The return type for the suggestFriends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFriendsInputSchema = z.object({
  userProfile: z
    .string()
    .describe('A detailed profile of the user, including interests, values, and activities.'),
  userActivity: z
    .string()
    .describe('A summary of the user’s recent activity within the app.'),
  numberOfSuggestions: z
    .number()
    .default(3)
    .describe('The number of friend suggestions to generate.'),
});
export type SuggestFriendsInput = z.infer<typeof SuggestFriendsInputSchema>;

const SuggestFriendsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of usernames who may be good friends for the user.'),
});
export type SuggestFriendsOutput = z.infer<typeof SuggestFriendsOutputSchema>;

export async function suggestFriends(input: SuggestFriendsInput): Promise<SuggestFriendsOutput> {
  return suggestFriendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFriendsPrompt',
  input: {schema: SuggestFriendsInputSchema},
  output: {schema: SuggestFriendsOutputSchema},
  prompt: `You are a social connector AI, skilled at suggesting potential friends to users of the DostiConnect app.

  Given a user's profile and recent activity, suggest {{numberOfSuggestions}} usernames of other users who might be good friends for them. Return only the usernames. 

  User Profile: {{{userProfile}}}
  User Activity: {{{userActivity}}}`,
});

const suggestFriendsFlow = ai.defineFlow(
  {
    name: 'suggestFriendsFlow',
    inputSchema: SuggestFriendsInputSchema,
    outputSchema: SuggestFriendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
