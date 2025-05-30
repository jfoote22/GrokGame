// Global declarations
declare interface Window {
  demoFirestore?: {
    collections: {
      coupons: any[];
      [key: string]: any[];
    };
  };
} 