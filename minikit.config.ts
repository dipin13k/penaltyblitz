const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEwNDE1NDEsInR5cGUiOiJhdXRoIiwia2V5IjoiMHgwRTc0OUYzQWY0YUU3OTlGQjg3OUFCMUYzQ0Q3MzFlRjZBRjNjRDAwIn0",
    payload: "eyJkb21haW4iOiJwZW5hbHR5YmxpdHoudmVyY2VsLmFwcCJ9",
    signature: "Gkbp94ZKI+Fkajp47oiMT9x2dCFlHnRC5p2TKdaUjeJw8XQTVHm8tmoFE2bUQhy0P8v586SmMJjio+saA523bBw=",
  },
  baseBuilder: {
    ownerAddress: "",
  },
  miniapp: {
    version: "1",
    name: "Penalty Blitz",
    subtitle: "Penalty Kick Game",
    description: "A penalty shootout game onchain on Base",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#1a1a2e",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["game", "arcade", "sports"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Score. Save. Dominate.",
    ogTitle: "Penalty Blitz",
    ogDescription: "A penalty kick game onchain on Base",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
