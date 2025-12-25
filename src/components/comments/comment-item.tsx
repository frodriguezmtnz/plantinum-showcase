import type { Comment } from '@/lib/comments';
import type { User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface CommentItemProps {
  comment: Comment;
  user: User | undefined;
}

export function CommentItem({ comment, user }: CommentItemProps) {
  return (
    <div className="flex items-start gap-4">
      <Avatar>
        <AvatarImage src={user?.avatarUrl} alt={user?.username} />
        <AvatarFallback>{user ? user.username.slice(0, 2).toUpperCase() : 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={user ? `/u/${user.username}` : '#'} className="font-semibold hover:underline">
            {user?.username || 'Anonymous'}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="mt-1 text-foreground/90">{comment.comment}</p>
      </div>
    </div>
  );
}
