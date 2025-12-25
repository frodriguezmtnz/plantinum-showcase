
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { moderateComment } from '@/ai/flows/moderate-comments';
import { addComment } from '@/lib/comments';
import { toast } from '@/hooks/use-toast';

// In a real application, this would come from an authentication session.
const FAKE_USER_ID = '1';

const CommentSchema = z.object({
  comment: z.string().min(3, { message: 'Comment must be at least 3 characters.' }).max(500, { message: 'Comment cannot be longer than 500 characters.' }),
  platinumId: z.string(),
});

export type State = {
  errors?: {
    comment?: string[];
    platinumId?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function createComment(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = CommentSchema.safeParse({
    comment: formData.get('comment'),
    platinumId: formData.get('platinumId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid comment submission.',
      success: false,
    };
  }

  const { comment, platinumId } = validatedFields.data;

  try {
    const moderationResult = await moderateComment({ comment });

    if (!moderationResult.isSafe) {
      return {
        message: `Your comment was flagged as inappropriate${moderationResult.reason ? `: "${moderationResult.reason}"` : ''}. Please revise and try again.`,
        success: false,
      };
    }
    
    await addComment(platinumId, FAKE_USER_ID, comment);
    
  } catch (error) {
    console.error('Error creating comment:', error);
    return {
      message: 'A server error occurred. Please try again later.',
      success: false,
    };
  }
  
  revalidatePath(`/platinum/${platinumId}`);
  return { message: 'Comment added successfully.', success: true };
}
