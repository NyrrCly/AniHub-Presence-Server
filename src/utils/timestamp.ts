import { ActivityTimestamp, VideoState } from "../types/types.js";

export function activityTime(videoState: VideoState): ActivityTimestamp {
  const startTimestamp = Math.floor(videoState.currentDate - videoState.currentTime * 1000);
  const endTimestamp = Math.floor(startTimestamp + videoState.duration * 1000);
  return {
    startTimestamp,
    endTimestamp,
  };
}
