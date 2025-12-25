export interface Comment {
  id: string;
  platinumId: string;
  userId: string;
  comment: string;
  createdAt: string;
}

// In-memory store for comments, acting as a mock database.
let comments: Comment[] = [
  { id: 'c1', platinumId: '4', userId: '1', comment: 'Wow, what an epic shot! Really captures the Kratos rage.', createdAt: '2023-01-11T10:00:00Z' },
  { id: 'c2', platinumId: '4', userId: '3', comment: 'How long did it take you to beat Gná? She was tough!', createdAt: '2023-01-11T12:30:00Z' },
  { id: 'c3', platinumId: '2', userId: '2', comment: 'The scenery in this game is just breathtaking.', createdAt: '2022-08-22T18:00:00Z' },
  { id: 'c4', platinumId: '7', userId: '1', comment: 'This is a spoiler but what a beautiful moment in the game.', createdAt: '2024-04-01T15:00:00Z' },
  { id: 'c5', platinumId: '8', userId: '2', comment: 'Fear the Old Blood. Well done, Hunter!', createdAt: '2019-07-23T09:00:00Z' },
  { id: 'c6', platinumId: '8', userId: '1', comment: 'This game is a masterpiece. Congrats on the plat!', createdAt: '2019-07-23T11:00:00Z' },
];

export const getCommentsByPlatinumId = async (platinumId: string): Promise<Comment[]> => {
  return comments
    .filter(c => c.platinumId === platinumId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addComment = async (platinumId: string, userId: string, text: string): Promise<Comment> => {
  const newComment: Comment = {
    id: `c${Date.now()}`, // Use timestamp for a more unique ID in this mock setup
    platinumId,
    userId,
    comment: text,
    createdAt: new Date().toISOString(),
  };
  comments.unshift(newComment); // Add to the beginning of the array
  return newComment;
};
