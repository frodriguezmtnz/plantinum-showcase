import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";
import images from "../src/lib/placeholder-images.json";

type PlaceholderImage = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

interface ImageSeed {
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
}

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function getImage(seed: number): ImageSeed {
  const imageData = (images as { placeholderImages: PlaceholderImage[] }).placeholderImages[seed - 1];
  if (!imageData) {
    return {
      imageUrl: `https://picsum.photos/seed/${seed}/600/338`,
      imageHint: "game screenshot",
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

const USERS = [
  {
    id: "1",
    username: "trophy-hunter-1",
    email: "hunter@example.com",
    image: "https://i.pravatar.cc/150?u=trophy-hunter-1",
  },
  {
    id: "2",
    username: "gamer-goddess",
    email: "goddess@example.com",
    image: "https://i.pravatar.cc/150?u=gamer-goddess",
  },
  {
    id: "3",
    username: "platinum-player",
    email: "player@example.com",
    image: "https://i.pravatar.cc/150?u=platinum-player",
  },
];

const PLATINUM_SEEDS = [
  { id: "1", hash: "c1b2a3d4e5f6", gameName: "Elden Ring", platform: "PS5", platinumDate: new Date("2023-03-15"), isSpoiler: true, userId: "1", votes: 125, monthlyVotes: 30 },
  { id: "2", hash: "f6e5d4c3b2a1", gameName: "Ghost of Tsushima", platform: "PS4", platinumDate: new Date("2022-08-20"), isSpoiler: false, userId: "1", votes: 230, monthlyVotes: 45 },
  { id: "3", hash: "a1b2c3d4e5f6", gameName: "Spider-Man 2", platform: "PS5", platinumDate: new Date("2023-11-01"), isSpoiler: false, userId: "1", votes: 180, monthlyVotes: 60 },
  { id: "4", hash: "d4e5f6a1b2c3", gameName: "God of War Ragnarok", platform: "PS5", platinumDate: new Date("2023-01-10"), isSpoiler: true, userId: "2", votes: 310, monthlyVotes: 95 },
  { id: "5", hash: "c3b2a1d4e5f6", gameName: "The Last of Us Part I", platform: "PS5", platinumDate: new Date("2022-09-20"), isSpoiler: false, userId: "2", votes: 250, monthlyVotes: 55 },
  { id: "6", hash: "e5f6a1b2c3d4", gameName: "Horizon Forbidden West", platform: "PS4", platinumDate: new Date("2022-04-05"), isSpoiler: false, userId: "2", votes: 190, monthlyVotes: 40 },
  { id: "7", hash: "b2a1d4e5f6c3", gameName: "Final Fantasy VII Rebirth", platform: "PS5", platinumDate: new Date("2024-03-30"), isSpoiler: true, userId: "3", votes: 280, monthlyVotes: 88 },
  { id: "8", hash: "a1d4e5f6c3b2", gameName: "Bloodborne", platform: "PS4", platinumDate: new Date("2019-07-22"), isSpoiler: false, userId: "3", votes: 450, monthlyVotes: 72 },
  { id: "9", hash: "d4e5f6c3b2a1", gameName: "Uncharted 4", platform: "PS4", platinumDate: new Date("2017-05-19"), isSpoiler: false, userId: "1", votes: 150, monthlyVotes: 10 },
  { id: "10", hash: "f6c3b2a1d4e5", gameName: "Persona 5 Royal", platform: "PS4", platinumDate: new Date("2021-06-12"), isSpoiler: false, userId: "2", votes: 210, monthlyVotes: 35 },
  { id: "11", hash: "b2a1d4e5f6c3a", gameName: "Cyberpunk 2077", platform: "PS5", platinumDate: new Date("2023-10-05"), isSpoiler: false, userId: "3", votes: 175, monthlyVotes: 65 },
  { id: "12", hash: "a1d4e5f6c3b2b", gameName: "Red Dead Redemption 2", platform: "PS4", platinumDate: new Date("2020-02-14"), isSpoiler: false, userId: "1", votes: 380, monthlyVotes: 25 },
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        ...user,
        name: user.username,
        passwordHash,
        emailVerified: new Date(),
      },
    });
  }
  console.log(`  ✔ ${USERS.length} users`);

  for (let i = 0; i < PLATINUM_SEEDS.length; i++) {
    const plat = PLATINUM_SEEDS[i];
    if (!plat) continue;
    const img = getImage(i + 1);
    await prisma.platinum.upsert({
      where: { id: plat.id },
      update: {},
      create: { ...plat, ...img },
    });
  }
  console.log(`  ✔ ${PLATINUM_SEEDS.length} platinums`);

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });