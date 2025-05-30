export interface Coupon {
  id?: string;
  name: string;
  description: string;
  rarity: string;
  discount: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  imagePrompt?: string;
  modelUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
} 