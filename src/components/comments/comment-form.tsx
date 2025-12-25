'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { createComment, type State } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Posting...' : 'Post Comment'}
    </Button>
  );
}

export function CommentForm({ platinumId }: { platinumId: string }) {
  const initialState: State = { message: null, errors: {}, success: false };
  const [state, dispatch] = useFormState(createComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      textAreaRef.current?.focus();
    }
  }, [state.success]);

  return (
    <form action={dispatch} ref={formRef} className="flex items-start gap-4">
      <Avatar className="hidden sm:block">
        <AvatarImage src="https://i.pravatar.cc/150?u=trophy-hunter-1" alt="Current User" />
        <AvatarFallback>ME</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <input type="hidden" name="platinumId" value={platinumId} />
        <Textarea
          ref={textAreaRef}
          name="comment"
          placeholder="Add your comment..."
          className="mb-2"
          aria-invalid={!!state.errors?.comment}
          aria-describedby="comment-error"
        />
        <div id="comment-error" aria-live="polite" aria-atomic="true">
          {state.errors?.comment && state.errors.comment.map((error: string) => (
            <p className="text-sm text-destructive" key={error}>{error}</p>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-2">
            <div>
                {state.message && (
                <Alert variant={state.success ? 'default' : 'destructive'} className="p-2 text-sm">
                    <Terminal className="h-4 w-4" />
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
                )}
            </div>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
