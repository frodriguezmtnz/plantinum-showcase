import type { Comment } from '@/lib/comments';
import type { User } from '@/lib/data';
import { Separator } from '../ui/separator';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';

interface CommentSectionProps {
  platinumId: string;
  comments: Comment[];
  allUsers: User[];
}

export function CommentSection({ platinumId, comments, allUsers }: CommentSectionProps) {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Community Comments ({comments.length})</h2>
      </header>
      <div className="p-6 border rounded-lg bg-card/50">
        <CommentForm platinumId={platinumId} />
      </div>
      <Separator />
      <CommentList comments={comments} allUsers={allUsers} />
    </section>
  );
}
