export const SERVICE_SLUGS = [
  { slug: "custom-business-software", key: "software" },
  { slug: "ai-agent-workflows", key: "ai" },
  { slug: "healthcare-software-solutions", key: "healthcare" },
  { slug: "software-engineering-consulting", key: "consulting" },
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number]["slug"];
export type ServiceKey = (typeof SERVICE_SLUGS)[number]["key"];
