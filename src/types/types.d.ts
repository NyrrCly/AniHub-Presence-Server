export interface ActivityData {
  details?: string;
  state?: string;
  type?: number;
  largeImageKey?: string;
  largeImageText?: string;
  largeImageUrl?: string;
  smallImageKey?: string;
  smallImageText?: string;
  smallImageUrl?: string;
  partyId?: string;
  partySize?: number;
  partyMax?: number;
  startTimestamp?: number;
  endTimestamp?: number;
  buttons?: { label: string; url: string }[];
}
