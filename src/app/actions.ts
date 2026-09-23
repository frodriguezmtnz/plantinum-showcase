'use server';

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStorageConfigured, putImage, storageImageKey } from "@/lib/b2";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1600;

const uploadSchema = z.object({
  gameName: z.string().trim().min(5).max(120),
  platform: z.enum(["PS3", "PS4", "PS5"]),
  platinumDate: z.coerce.date(),
  isSpoiler: z.boolean(),
  comment: z.string().trim().max(500).optional(),
});

export async function uploadPlatinum(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      success: false as const,
      error: "Debes iniciar sesión para subir un platino.",
    };
  }

  if (!isStorageConfigured()) {
    return {
      success: false as const,
      error: "El almacenamiento de imágenes no está configurado todavía.",
    };
  }

  const parsed = uploadSchema.safeParse({
    gameName: formData.get("gameName"),
    platform: formData.get("platform"),
    platinumDate: formData.get("platinumDate"),
    isSpoiler: formData.get("isSpoiler") === "true",
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Los datos del formulario no son válidos.",
    };
  }

  const file = formData.get("screenshot");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "La captura es obligatoria." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      success: false as const,
      error: "La imagen supera el tamaño máximo de 6 MB.",
    };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false as const,
      error: "Formato no soportado. Usa JPG, PNG o WEBP.",
    };
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let processed;
  try {
    processed = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .avif({ quality: 60, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return {
      success: false as const,
      error: "El archivo no es una imagen válida.",
    };
  }

  const hash = createHash("sha256").update(processed.data).digest("hex");
  const key = storageImageKey(hash);

  try {
    await putImage(key, processed.data);
  } catch {
    return {
      success: false as const,
      error: "No se pudo subir la imagen. Inténtalo de nuevo.",
    };
  }

  const imageHint =
    parsed.data.gameName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 4)
      .join("-") || "game screenshot";

  try {
    const platinum = await prisma.platinum.create({
      data: {
        hash,
        gameName: parsed.data.gameName,
        platform: parsed.data.platform,
        platinumDate: parsed.data.platinumDate,
        isSpoiler: parsed.data.isSpoiler,
        comment: parsed.data.comment,
        userId,
        votes: 0,
        monthlyVotes: 0,
        imageUrl: `/api/images/${key}`,
        imageHint,
        width: processed.info.width,
        height: processed.info.height,
      },
    });

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/hall-of-fame");

    return { success: true as const, platinumId: platinum.id };
  } catch {
    return {
      success: false as const,
      error: "No se pudo guardar el platino. Inténtalo de nuevo.",
    };
  }
}
