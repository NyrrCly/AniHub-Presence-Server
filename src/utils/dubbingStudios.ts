import { DubbingStudio } from "../types/types.js";

export function getDubbingStudioLogoUrl(
  dubbing_studios: DubbingStudio[],
  dubbingStudioName: string,
): string {
  return (
    dubbing_studios.find((studio) => studio.name === dubbingStudioName)
      ?.logo_url || ""
  );
}
