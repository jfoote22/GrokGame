"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDocuments } from '@/lib/firebase/firebaseUtils';
import { Coupon } from '@/lib/models/coupon';
import Header from '@/components/Header';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const fetchedCoupons = await getDocuments('coupons');
        setCoupons(fetchedCoupons as Coupon[]);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="p-4">
        <div className="container mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Coupons</h2>
            <Link 
              href="/create-coupon" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create New Coupon
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-200">No coupons found</h3>
              <p className="text-gray-400 mt-2">Create your first coupon to get started</p>
              <Link 
                href="/create-coupon" 
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create New Coupon
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className="rounded-lg p-4 bg-gray-800 hover:bg-gray-750 transition-colors border-l-4 border-blue-500"
                >
                  <h3 className="font-bold text-lg text-white">{coupon.name}</h3>
                  <p className="text-sm text-gray-300 mt-1">{coupon.description}</p>
                  <div className="mt-2 text-blue-400 font-semibold">{coupon.discount} discount</div>
                  <div className="mt-2 text-sm text-gray-300">
                    <div>Valid from: {new Date(coupon.startDate).toLocaleDateString()} ({coupon.startTime})</div>
                    <div>Valid until: {new Date(coupon.endDate).toLocaleDateString()} ({coupon.endTime})</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Location: {coupon.location.lat.toFixed(6)}, {coupon.location.lng.toFixed(6)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 