import type { Comment } from '@/lib/comments';
import type { User } from '@/lib/data';
import { CommentItem } from './comment-item';

interface CommentListProps {
  comments: Comment[];
  allUsers: User[];
}

export function CommentList({ comments, allUsers }: CommentListProps) {
  const getUserById = (userId: string) => allUsers.find(u => u.id === userId);

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} user={getUserById(comment.userId)} />
      ))}
    </div>
  );
}
