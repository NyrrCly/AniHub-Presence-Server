import { DubbingStudio } from "../types/types.js";

export function getDubbingStudioLogoUrl(
  dubbing_studios: DubbingStudio[],
  dubbingStudioName: string,
): string | undefined {
  const studioName = dubbingStudioName
    .toLowerCase()
    .replace(/^Субтитри\s*·\s*/i, "")
    .split(/[-_]/)
    .map((p) => p.trim());

  const foundStudio = dubbing_studios.find((studio) => {
    const studioApiName = studio.name.toLowerCase().trim();
    return studioName.includes(studioApiName);
  });

  return foundStudio ? foundStudio.logo_url : undefined;
}
