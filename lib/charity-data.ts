/**
 * Charity configuration — verified EINs and metadata for tax receipts.
 * Support Wishbee: ein is null (platform tips are not tax-deductible under 501(c)(3)).
 */

export type CharityConfig = {
  id: string
  name: string
  ein: string | null
  website: string
  description?: string
  icon?: "heart" | "globe" | "leaf" | "cross"
  logo?: string
}

export const CHARITY_DATA: CharityConfig[] = [
  { id: "feeding-america", name: "Feeding America", ein: "36-3673599", website: "https://www.feedingamerica.org", description: "Help provide meals to families in need", icon: "heart", logo: "/images/charity-logos/FeedingAmerica.png" },
  { id: "red-cross", name: "American Red Cross", ein: "53-0196605", website: "https://www.redcross.org", description: "Provide disaster relief & emergency assistance", icon: "cross", logo: "/images/charity-logos/American%20Red%20Cross.jpg" },
  { id: "st-jude", name: "St. Jude Children's Research Hospital", ein: "62-0646012", website: "https://www.stjude.org", description: "Treat childhood cancer and life-threatening diseases", icon: "heart" },
  { id: "wwf", name: "World Wildlife Fund", ein: "52-1693387", website: "https://www.worldwildlife.org", description: "Protect wildlife and their habitats globally", icon: "leaf" },
  { id: "habitat-for-humanity", name: "Habitat for Humanity", ein: "91-1914868", website: "https://www.habitat.org", description: "Build affordable housing for families in need", icon: "heart" },
  { id: "unicef", name: "UNICEF", ein: "13-1623829", website: "https://www.unicef.org", description: "Support children's health & education globally", icon: "globe", logo: "/images/charity-logos/Unicef.png" },
  { id: "edf", name: "Environmental Defense Fund", ein: "11-6107399", website: "https://www.edf.org", description: "Protect the planet & stabilize the climate", icon: "leaf", logo: "/images/charity-logos/Environmental%20Defense%20Fund.png" },
  { id: "support-wishbee", name: "Wishbee", ein: null, website: "https://wishbee.ai", description: "Platform tip — not tax-deductible" },
]

/** Support Wishbee — platform tips, not tax-deductible; EIN explicitly null */
export const SUPPORT_WISHBEE: CharityConfig = {
  id: "support-wishbee",
  name: "Wishbee",
  ein: null,
  website: "https://wishbee.ai",
}

export function getCharityById(id: string): CharityConfig | undefined {
  return CHARITY_DATA.find((c) => c.id === id)
}

export function getCharityEin(id: string): string | null {
  const charity = getCharityById(id)
  return charity?.ein ?? null
}
