'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

interface Listing {
  id: number;
  hangar_number: string;
  aerodrome_name: string;
  city: string;
  description: string;
  image_url: string;
  hourly_rate: number;
  daily_rate: number;
  monthly_rate: number;
  availability_status: string;
  is_paid: boolean;
  paid_at: string | null;
}

interface GalleryProps {
  initialStatus?: string;
  initialCity?: string;
}

export function HangarGallery({ initialStatus = 'available', initialCity = '' }: GalleryProps) {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHangar, setSelectedHangar] = useState<Listing | null>(null);
  const [filters, setFilters] = useState({ status: initialStatus, city: initialCity });
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 12 });

  useEffect(() => {
    fetchListings();
  }, [filters.status, filters.city, pagination.offset]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filters.status,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (filters.city) params.append('city', filters.city);

      const response = await fetch(`/api/hangarshare/listings/with-images?${params}`);
      const data = await response.json();

      if (data.success) {
        setListings(data.data);
        setPagination({
          ...pagination,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cities = [...new Set(listings.map((l) => l.city))];

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, offset: 0 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {cities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={filters.city}
              onChange={(e) => {
                setFilters({ ...filters, city: e.target.value });
                setPagination({ ...pagination, offset: 0 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="text-gray-500">Loading hangars...</div>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="text-gray-500">No hangars found</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => setSelectedHangar(listing)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.hangar_number}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {listing.is_paid && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Paid
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{listing.hangar_number}</h3>
                  <p className="text-sm text-gray-600 mb-2">{listing.aerodrome_name}</p>
                  <p className="text-xs text-gray-500 mb-3">{listing.city}</p>

                  {/* Rates */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    {listing.hourly_rate && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Hourly</div>
                        <div className="font-bold text-blue-600">R$ {listing.hourly_rate}</div>
                      </div>
                    )}
                    {listing.daily_rate && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Daily</div>
                        <div className="font-bold text-blue-600">R$ {listing.daily_rate}</div>
                      </div>
                    )}
                    {listing.monthly_rate && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Monthly</div>
                        <div className="font-bold text-blue-600">R$ {listing.monthly_rate}</div>
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() =>
                setPagination({
                  ...pagination,
                  offset: Math.max(0, pagination.offset - pagination.limit),
                })
              }
              disabled={pagination.offset === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Previous
            </button>

            <div className="flex items-center text-gray-600">
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
              {Math.ceil(pagination.total / pagination.limit)}
            </div>

            <button
              onClick={() =>
                setPagination({
                  ...pagination,
                  offset: pagination.offset + pagination.limit,
                })
              }
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal Detail View */}
      {selectedHangar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedHangar(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-6 p-6">
              {/* Image */}
              <div className="w-1/2">
                {selectedHangar.image_url && (
                  <img
                    src={selectedHangar.image_url}
                    alt={selectedHangar.hangar_number}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Details */}
              <div className="w-1/2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedHangar.hangar_number}</h2>
                    <p className="text-gray-600">{selectedHangar.aerodrome_name}</p>
                    <p className="text-sm text-gray-500">{selectedHangar.city}</p>
                  </div>
                  <button
                    onClick={() => setSelectedHangar(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <p className="text-gray-700 mb-4 text-sm">{selectedHangar.description}</p>

                {/* Pricing Table */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 mb-2">Pricing</h3>
                  <div className="space-y-1 text-sm">
                    {selectedHangar.hourly_rate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hourly:</span>
                        <span className="font-bold text-blue-600">R$ {selectedHangar.hourly_rate}</span>
                      </div>
                    )}
                    {selectedHangar.daily_rate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily:</span>
                        <span className="font-bold text-blue-600">R$ {selectedHangar.daily_rate}</span>
                      </div>
                    )}
                    {selectedHangar.monthly_rate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className="font-bold text-blue-600">R$ {selectedHangar.monthly_rate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex gap-2 items-center text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedHangar.availability_status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : selectedHangar.availability_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedHangar.availability_status}
                  </span>
                  {selectedHangar.is_paid && <span className="text-green-600">✓ Paid</span>}
                </div>

                <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
