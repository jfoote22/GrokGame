import { Coupon } from "@/lib/models/coupon";
import { addDocument, getDocuments } from "./firebaseUtils";

// Sample coupon data - reduced to three examples
export const sampleCoupons: Omit<Coupon, 'id'>[] = [
  {
    name: "Summer Sale - 25% OFF",
    description: "Get 25% off all summer items throughout the season!",
    discount: "25% OFF",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2023-08-31"),
    startTime: "09:00",
    endTime: "21:00",
    location: { lat: 37.7749, lng: -122.4194 }, // San Francisco
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Buy One Get One Free - Coffee",
    description: "Purchase any coffee and get a second one of equal or lesser value for free!",
    discount: "BOGO",
    startDate: new Date("2023-07-15"),
    endDate: new Date("2023-07-31"),
    startTime: "07:00",
    endTime: "11:00",
    location: { lat: 40.7128, lng: -74.0060 }, // New York
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Weekend Discount - 15% OFF",
    description: "Save 15% on all purchases during weekends!",
    discount: "15% OFF",
    startDate: new Date("2023-07-01"),
    endDate: new Date("2023-12-31"),
    startTime: "00:00",
    endTime: "23:59",
    location: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Function to add sample data to Firestore
export const initializeSampleData = async () => {
  try {
    // Check if we already have coupons
    const existingCoupons = await getDocuments('coupons');
    
    // Only add sample data if no coupons exist
    if (existingCoupons.length === 0) {
      console.log('Adding sample coupon data...');
      
      // Add each sample coupon
      for (const coupon of sampleCoupons) {
        await addDocument('coupons', coupon);
      }
      
      console.log('Sample data initialization complete!');
    } else {
      console.log('Skipping sample data initialization - data already exists');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}; 