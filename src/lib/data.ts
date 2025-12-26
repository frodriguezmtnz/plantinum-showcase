
import { placeholderImages } from './placeholder-images.json';

// A simple, non-crypto hash function for demonstration purposes.
function simpleHash(text: string): string {
    let hash = 0;
    if (text.length === 0) {
        return "0";
    }
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to a base36 string and take a slice to keep it reasonably short
    return Math.abs(hash).toString(36) + (hash > 0 ? 'a' : 'b') + text.length.toString(36);
}


export interface Platinum {
  id: string;
  hash: string;
  gameName: string;
  platform: 'PS3' | 'PS4' | 'PS5';
  platinumDate: string;
  isSpoiler: boolean;
  userId: string;
  votes: number;
  monthlyVotes: number;
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  pridePlatinumId?: string;
}

const users: User[] = [
  { id: '1', username: 'trophy-hunter-1', avatarUrl: 'https://i.pravatar.cc/150?u=trophy-hunter-1', pridePlatinumId: '2' },
  { id: '2', username: 'gamer-goddess', avatarUrl: 'https://i.pravatr.cc/150?u=gamer-goddess', pridePlatinumId: '4' },
  { id: '3', username: 'platinum-player', avatarUrl: 'https://i.pravatar.cc/150?u=platinum-player' },
];

function getImage(seed: number) {
  // The seed is 1-based, but our array is 0-based.
  const imageData = placeholderImages[seed - 1];
  
  if (!imageData) {
    // Fallback if the image isn't found, though it shouldn't happen with the current data.
    const fallbackUrl = `https://picsum.photos/seed/${seed}/600/338`;
    return {
      imageUrl: fallbackUrl,
      imageHint: 'game screenshot',
      width: 600,
      height: 338,
    };
  }

  return {
    imageUrl: imageData.imageUrl,
    imageHint: imageData.imageHint,
    width: 600,
    height: 338,
  };
}

const rawPlatinums: Omit<Platinum, 'hash'>[] = [
  { id: '1', gameName: 'Elden Ring', platform: 'PS5', platinumDate: '2023-03-15', isSpoiler: true, userId: '1', votes: 125, monthlyVotes: 30, ...getImage(1) },
  { id: '2', gameName: 'Ghost of Tsushima', platform: 'PS4', platinumDate: '2022-08-20', isSpoiler: false, userId: '1', votes: 230, monthlyVotes: 45, ...getImage(2) },
  { id: '3', gameName: 'Spider-Man 2', platform: 'PS5', platinumDate: '2023-11-01', isSpoiler: false, userId: '1', votes: 180, monthlyVotes: 60, ...getImage(3) },
  { id: '4', gameName: 'God of War Ragnarok', platform: 'PS5', platinumDate: '2023-01-10', isSpoiler: true, userId: '2', votes: 310, monthlyVotes: 95, ...getImage(4) },
  { id: '5', gameName: 'The Last of Us Part I', platform: 'PS5', platinumDate: '2022-09-20', isSpoiler: false, userId: '2', votes: 250, monthlyVotes: 55, ...getImage(5) },
  { id: '6', gameName: 'Horizon Forbidden West', platform: 'PS4', platinumDate: '2022-04-05', isSpoiler: false, userId: '2', votes: 190, monthlyVotes: 40, ...getImage(6) },
  { id: '7', gameName: 'Final Fantasy VII Rebirth', platform: 'PS5', platinumDate: '2024-03-30', isSpoiler: true, userId: '3', votes: 280, monthlyVotes: 88, ...getImage(7) },
  { id: '8', gameName: 'Bloodborne', platform: 'PS4', platinumDate: '2019-07-22', isSpoiler: false, userId: '3', votes: 450, monthlyVotes: 72, ...getImage(8) },
  { id: '9', gameName: 'Uncharted 4', platform: 'PS4', platinumDate: '2017-05-19', isSpoiler: false, userId: '1', votes: 150, monthlyVotes: 10, ...getImage(9) },
  { id: '10', gameName: 'Persona 5 Royal', platform: 'PS4', platinumDate: '2021-06-12', isSpoiler: false, userId: '2', votes: 210, monthlyVotes: 35, ...getImage(10) },
  { id: '11', gameName: 'Cyberpunk 2077', platform: 'PS5', platinumDate: '2023-10-05', isSpoiler: false, userId: '3', votes: 175, monthlyVotes: 65, ...getImage(11) },
  { id: '12', gameName: 'Red Dead Redemption 2', platform: 'PS4', platinumDate: '2020-02-14', isSpoiler: false, userId: '1', votes: 380, monthlyVotes: 25, ...getImage(12) },
];

const platinums: Platinum[] = rawPlatinums.map(p => {
  const user = users.find(u => u.id === p.userId);
  const username = user ? user.username : 'unknown-user';
  return {
    ...p,
    hash: simpleHash(`${p.gameName}-${username}-${p.platinumDate}`)
  };
});


// Data access functions
export const getUsers = async (): Promise<User[]> => {
  return users;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  return users.find(user => user.id === id);
};

export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  return users.find(user => user.username === username);
};

export const getPlatinums = async (): Promise<Platinum[]> => {
  return platinums;
};

export const getPlatinumById = async (id: string): Promise<Platinum | undefined> => {
  return platinums.find(p => p.id === id);
};

export const getPlatinumByHash = async (hash: string): Promise<Platinum | undefined> => {
  return platinums.find(p => p.hash === hash);
};

export const getPlatinumsByUserId = async (userId: string): Promise<Platinum[]> => {
  return platinums.filter(p => p.userId === userId);
};

export const getHallOfFame = async (limit: number = 1): Promise<Platinum[]> => {
  return [...platinums].sort((a, b) => b.monthlyVotes - a.monthlyVotes).slice(0, limit);
};

export const getTopPlatinums = async (limit: number = 5): Promise<Platinum[]> => {
  // Exclude hall of fame winner from top platinums
  const hallOfFame = await getHallOfFame(1);
  const hallOfFameId = hallOfFame[0]?.id;
  const filteredPlatinums = platinums.filter(p => p.id !== hallOfFameId);
  return [...filteredPlatinums].sort((a, b) => b.monthlyVotes - a.monthlyVotes).slice(0, limit);
};

export const getLatestPlatinums = async (limit: number = 8): Promise<Platinum[]> => {
    return [...platinums].sort((a, b) => new Date(b.platinumDate).getTime() - new Date(a.platinumDate).getTime()).slice(0, limit);
};


export const getMonthlyRanking = async (limit: number = 10): Promise<Platinum[]> => {
  return [...platinums].sort((a, b) => b.monthlyVotes - a.monthlyVotes).slice(0, limit);
};
