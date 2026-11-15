export {};

declare global {
  interface Window {
    accountIcon: () => void;
    dubbingIcon: () => void;
    anonymity: () => void;
    store: {
      getStoreValue: (key: string) => any;
      setStoreValue: (key: string, value: any) => void;
    };
    electron: {
      onBeforeClose: (callback: (width: number) => void) => void;
      ackClose: () => void;
    };
    preference: {
      accountIcon: (enabled: boolean) => void;
      dubbingIcon: (enabled: boolean) => void;
      anonymity: (enabled: boolean) => void;
    };
    anihubLogin: {
      onAuthSuccess: (callback: (code: string) => void) => void;
    };
  }
}
