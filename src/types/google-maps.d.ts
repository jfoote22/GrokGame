import { GoogleMap, Marker } from '@react-google-maps/api';

declare global {
  interface Window {
    demoFirestore?: {
      collections: {
        coupons: any[];
        [key: string]: any[];
      };
    };
    google: any;
  }
}

export {}; 