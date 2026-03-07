const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEwNDE1NDEsInR5cGUiOiJhdXRoIiwia2V5IjoiMHgwRTc0OUYzQWY0YUU3OTlGQjg3OUFCMUYzQ0Q3MzFlRjZBRjNjRDAwIn0",
    payload: "eyJkb21haW4iOiJwZW5hbHR5YmxpdHoudmVyY2VsLmFwcCJ9",
    signature: "Gkbp94ZKI+Fkajp47oiMT9x2dCFlHnRC5p2TKdaUjeJw8XQTVHm8tmoFE2bUQhy0P8v586SmMJjio+saA523bBw=",
  },
  baseBuilder: {
    ownerAddress: "0x42adA0062FC76E56fC33709a2B03f9BddB55975F",
  },
  miniapp: {
    version: "1",
    name: "Penalty Blitz",
    subtitle: "Fast-paced penalty kick game",
    description: "Step up to the spot and take your shot. Penalty Blitz is a fast-paced penalty shootout game — aim, shoot, save, and climb the global leaderboard.",
    screenshotUrls: [
      `${ROOT_URL}/screenshot1.jpg`,
      `${ROOT_URL}/screenshot2.jpg`,
      `${ROOT_URL}/screenshot3.jpg`,
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#1a1a2e",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["game", "arcade", "sports", "onchain"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Score. Save. Dominate.",
    ogTitle: "Penalty Blitz — Penalty Kick Game",
    ogDescription: "Step up to the spot. Aim, shoot, save — climb the global leaderboard.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
