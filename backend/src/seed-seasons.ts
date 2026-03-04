import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// SEASONS
// ============================================

const SEASONS = [
  {
    id: "season_easter",
    name: "Semana Santa",
    startDate: new Date("2026-03-23T00:00:00.000Z"),
    endDate: new Date("2026-04-06T23:59:59.000Z"),
    priority: 1,
    storeSlot: "featured_adventure",
    bannerTitle: "Camino de la Cruz",
    bannerDescription:
      "Revive la pasión, muerte y resurrección de Cristo.",
    accentColor: "#7A1F1F",
    isActive: true,
    preview: true, // DEV: treat as active even before startDate
  },
];

// ============================================
// EASTER SEASON STORE ITEMS
// ============================================

const EASTER_ITEMS = [
  // ── Bundle ─────────────────────────────────────────────────
  {
    id: "bundle_easter_path",
    type: "bundle",
    nameEn: "Path of the Cross",
    nameEs: "Camino de la Cruz",
    descriptionEn:
      "A special Holy Week bundle with exclusive Easter rewards.",
    descriptionEs:
      "Un paquete especial de Semana Santa con recompensas exclusivas de Pascua.",
    pricePoints: 3000,
    rarity: "epic",
    assetRef: "bundle_easter_path",
    sortOrder: 1,
    available: true,
    category: "Paquetes",
    subcategory: "Aventuras",
    isNew: true,
    animationType: "glow",
    badge: "✝ Semana Santa",
    bundleId: null,
    comingSoon: false,
    seasonId: "season_easter",
    metadata: JSON.stringify({
      isAdventure: true,
      adventureNumber: 10,
      rewards: [
        "avatar_easter_cross_light",
        "frame_easter_resurrection",
        "title_resurrection_power",
      ],
      descriptionEn:
        "Walk the path of the Cross this Holy Week. Unlock exclusive avatar, frame and title.",
      descriptionEs:
        "Camina el sendero de la Cruz esta Semana Santa. Desbloquea avatar, marco y título exclusivos.",
    }),
  },

  // ── Avatar reward ──────────────────────────────────────────
  {
    id: "avatar_easter_cross_light",
    type: "avatar",
    nameEn: "Cross of Light",
    nameEs: "Cruz de Luz",
    descriptionEn:
      "A radiant cross bathed in resurrection light. Holy Week exclusive.",
    descriptionEs:
      "Una cruz radiante bañada en la luz de la resurrección. Exclusivo Semana Santa.",
    pricePoints: 0,
    rarity: "epic",
    assetRef: "avatar_easter_cross_light",
    sortOrder: 2,
    available: true,
    category: "Avatares",
    subcategory: "V3 Premium",
    isNew: true,
    animationType: "glow",
    badge: "✝ Semana Santa",
    bundleId: "bundle_easter_path",
    comingSoon: false,
    seasonId: "season_easter",
    metadata: JSON.stringify({
      emoji: "✝️",
      illustratedStyle: "v3",
      color: "#C0392B",
    }),
  },

  // ── Frame reward ───────────────────────────────────────────
  {
    id: "frame_easter_resurrection",
    type: "frame",
    nameEn: "Resurrection Frame",
    nameEs: "Marco Resurrección",
    descriptionEn:
      "Golden frame adorned with lilies and a morning light — the symbol of the Risen Christ.",
    descriptionEs:
      "Marco dorado adornado con lirios y luz de amanecer, símbolo del Cristo Resucitado.",
    pricePoints: 0,
    rarity: "epic",
    assetRef: "frame_easter_resurrection",
    sortOrder: 3,
    available: true,
    category: "Marcos",
    subcategory: "V3 Premium",
    isNew: true,
    animationType: "sparkle",
    badge: "✝ Semana Santa",
    bundleId: "bundle_easter_path",
    comingSoon: false,
    seasonId: "season_easter",
    metadata: JSON.stringify({
      color: "#C0392B",
      style: "easter_lily",
    }),
  },

  // ── Title reward ───────────────────────────────────────────
  {
    id: "title_resurrection_power",
    type: "title",
    nameEn: "I Am the Resurrection",
    nameEs: "Yo Soy la Resurrección",
    descriptionEn: "\"I am the resurrection and the life.\" – John 11:25",
    descriptionEs: "\"Yo soy la resurrección y la vida.\" – Juan 11:25",
    pricePoints: 0,
    rarity: "rare",
    assetRef: "title_resurrection_power",
    sortOrder: 4,
    available: true,
    category: "Títulos",
    subcategory: "V2 Citas Bíblicas",
    isNew: true,
    animationType: "none",
    badge: "✝ Semana Santa",
    bundleId: "bundle_easter_path",
    comingSoon: false,
    seasonId: "season_easter",
    metadata: JSON.stringify({
      visibleText: "Yo soy la resurrección y la vida",
      reference: "Juan 11:25",
      color: "#C0392B",
    }),
  },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedSeasons() {
  console.log("[SeedSeasons] Starting season seed...");

  let seasonCount = 0;
  let itemCount = 0;
  let skippedSeasons = 0;
  let skippedItems = 0;

  // Seed seasons
  for (const season of SEASONS) {
    try {
      await prisma.season.upsert({
        where: { id: season.id },
        update: {
          name: season.name,
          startDate: season.startDate,
          endDate: season.endDate,
          priority: season.priority,
          storeSlot: season.storeSlot,
          bannerTitle: season.bannerTitle,
          bannerDescription: season.bannerDescription,
          accentColor: season.accentColor,
          isActive: season.isActive,
          preview: season.preview,
        },
        create: season,
      });
      seasonCount++;
    } catch (err) {
      console.warn(`[SeedSeasons] Skipping season ${season.id}:`, err);
      skippedSeasons++;
    }
  }

  // Seed Easter items
  for (const item of EASTER_ITEMS) {
    try {
      await prisma.storeItem.upsert({
        where: { id: item.id },
        update: {
          nameEn: item.nameEn,
          nameEs: item.nameEs,
          descriptionEn: item.descriptionEn,
          descriptionEs: item.descriptionEs,
          pricePoints: item.pricePoints,
          rarity: item.rarity,
          assetRef: item.assetRef,
          sortOrder: item.sortOrder,
          available: item.available,
          category: item.category,
          subcategory: item.subcategory,
          isNew: item.isNew,
          animationType: item.animationType,
          badge: item.badge,
          bundleId: item.bundleId,
          comingSoon: item.comingSoon,
          seasonId: item.seasonId,
          metadata: item.metadata,
        },
        create: {
          ...item,
          releasedAt: new Date(),
        },
      });
      itemCount++;
    } catch (err) {
      console.warn(`[SeedSeasons] Skipping item ${item.id}:`, err);
      skippedItems++;
    }
  }

  console.log(
    `[SeedSeasons] Done. Seasons: ${seasonCount} (skipped: ${skippedSeasons}), Items: ${itemCount} (skipped: ${skippedItems})`
  );
  return { seasonCount, itemCount };
}

// Run directly if executed standalone
if (import.meta.main) {
  seedSeasons()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
