"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MapSelector from '@/components/MapSelector';
import { addDocument } from '@/lib/firebase/firebaseUtils';
import { Coupon } from '@/lib/models/coupon';
import Header from '@/components/Header';

export default function CreateCouponPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState({ lat: 0, lng: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      // Validate form
      if (!name || !description || !discount || !startDate || !endDate) {
        setFormError('Please fill out all required fields');
        return;
      }

      // Create coupon object
      const coupon: Omit<Coupon, 'id'> = {
        name,
        description,
        discount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: startTime || '00:00',
        endTime: endTime || '23:59',
        location,
        rarity: 'common', // Added rarity field with default value
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore
      await addDocument('coupons', coupon);
      
      // Redirect to coupons list
      router.push('/coupons');
    } catch (error) {
      console.error('Error creating coupon:', error);
      setFormError('Failed to create coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="p-4">
        <div className="container mx-auto">
          <div className="mb-4">
            <Link 
              href="/coupons" 
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Coupons
            </Link>
          </div>

          <div className="bg-gray-800 shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-md">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - Map and Location */}
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Location</h2>
                    <MapSelector
                      selectedLocation={location}
                      onLocationSelected={setLocation}
                    />
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Selected Location</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-700 p-2 rounded">
                          <span className="text-gray-400">Latitude</span>
                          <div className="font-mono text-white">{location.lat.toFixed(6)}</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <span className="text-gray-400">Longitude</span>
                          <div className="font-mono text-white">{location.lng.toFixed(6)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column - Coupon Details */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Coupon Details</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Coupon Name*
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                      Description*
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-300 mb-1">
                      Discount*
                    </label>
                    <input
                      id="discount"
                      type="text"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="e.g. 10% OFF, Buy One Get One Free"
                      className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                        Start Date*
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                        End Date*
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">
                        Start Time
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">
                        End Time
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  href="/coupons"
                  className="mr-3 inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 py-2 px-4 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 