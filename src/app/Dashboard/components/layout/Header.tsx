"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, User } from "lucide-react";
import axios from "axios";

interface HeaderProps {
  activeView: string;
  navigationItems: unknown[];
}

interface SearchResult {
  id: number;
  type: 'roll' | 'batch' | 'subbatch' | 'vendor' | 'worker' | 'department';
  name: string;
  details?: string;
}

const Header: React.FC<HeaderProps> = ({ activeView }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Debounced search
  useEffect(() => {
    if (activeView === "dashboard") return; // Skip search on dashboard

    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeView]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const results: SearchResult[] = [];

      // Search rolls
      try {
        const rollsRes = await axios.get(`${API}/rolls`);
        const filteredRolls = rollsRes.data.filter((roll: { id: number; name?: string; color?: string }) =>
          roll.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        results.push(...filteredRolls.map((roll: { id: number; name: string; color?: string }) => ({
          id: roll.id,
          type: 'roll' as const,
          name: roll.name,
          details: `Color: ${roll.color || '-'}`
        })));
      } catch (err) {
        console.error('Error searching rolls:', err);
      }

      // Search batches
      try {
        const batchesRes = await axios.get(`${API}/batches`);
        const filteredBatches = batchesRes.data.filter((batch: { id: number; name?: string; quantity?: number; unit?: string }) =>
          batch.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        results.push(...filteredBatches.map((batch: { id: number; name: string; quantity?: number; unit?: string }) => ({
          id: batch.id,
          type: 'batch' as const,
          name: batch.name,
          details: `Quantity: ${batch.quantity || '-'} ${batch.unit || ''}`
        })));
      } catch (err) {
        console.error('Error searching batches:', err);
      }

      // Search sub-batches
      try {
        const subBatchesRes = await axios.get(`${API}/sub-batches`);
        const filteredSubBatches = subBatchesRes.data.filter((sb: { id: number; name?: string; estimated_pieces?: number }) =>
          sb.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        results.push(...filteredSubBatches.map((sb: { id: number; name: string; estimated_pieces?: number }) => ({
          id: sb.id,
          type: 'subbatch' as const,
          name: sb.name,
          details: `Estimated: ${sb.estimated_pieces || '-'} pieces`
        })));
      } catch (err) {
        console.error('Error searching sub-batches:', err);
      }

      // Search vendors
      try {
        const vendorsRes = await axios.get(`${API}/vendors`);
        const filteredVendors = vendorsRes.data.filter((vendor: { id: number; name?: string; phone?: string; address?: string }) =>
          vendor.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        results.push(...filteredVendors.map((vendor: { id: number; name: string; phone?: string; address?: string }) => ({
          id: vendor.id,
          type: 'vendor' as const,
          name: vendor.name,
          details: vendor.phone || vendor.address || ''
        })));
      } catch (err) {
        console.error('Error searching vendors:', err);
      }

      // Search workers
      try {
        const workersRes = await axios.get(`${API}/workers`);
        const filteredWorkers = workersRes.data.filter((worker: { id: number; name?: string; position?: string; department?: string }) =>
          worker.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        results.push(...filteredWorkers.map((worker: { id: number; name: string; position?: string; department?: string }) => ({
          id: worker.id,
          type: 'worker' as const,
          name: worker.name,
          details: worker.position || worker.department || ''
        })));
      } catch (err) {
        console.error('Error searching workers:', err);
      }

      // Search departments
      try {
        const deptsRes = await axios.get(`${API}/departments`);
        const filteredDepts = deptsRes.data.filter((dept: { id: number; name?: string }) =>
          dept.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        results.push(...filteredDepts.map((dept: { id: number; name: string }) => ({
          id: dept.id,
          type: 'department' as const,
          name: dept.name,
          details: ''
        })));
      } catch (err) {
        console.error('Error searching departments:', err);
      }

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      roll: 'Roll',
      batch: 'Batch',
      subbatch: 'Sub-Batch',
      vendor: 'Vendor',
      worker: 'Worker',
      department: 'Department'
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      roll: 'bg-blue-100 text-blue-800',
      batch: 'bg-green-100 text-green-800',
      subbatch: 'bg-purple-100 text-purple-800',
      vendor: 'bg-orange-100 text-orange-800',
      worker: 'bg-pink-100 text-pink-800',
      department: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <header className="bg-[#f7f7f7] px-6 py-3 relative h-[60px] flex items-center gap-4 w-full">
        {/* Spacer for centering */}
        <div className="flex-1"></div>

        {/* Search Bar - Center */}
        <div className="relative w-[500px]">
          <div className="flex items-center bg-white rounded-xl px-4 py-2 border border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-4 h-4 text-gray-500 mr-3" />
            <input
              type="text"
              placeholder="Search data, batches, workers, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="bg-transparent w-full text-sm outline-none text-gray-700 placeholder-gray-500"
            />
            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">CTRL + K</span>
            {isSearching && (
              <div className="ml-2 text-xs text-gray-500">Searching...</div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
              <div className="p-2">
                <div className="text-xs text-gray-500 px-3 py-2 font-semibold">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}-${index}`}
                    className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery("");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{result.name}</div>
                        {result.details && (
                          <div className="text-xs text-gray-500 mt-1">{result.details}</div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {showResults && searchQuery.trim().length > 1 && searchResults.length === 0 && !isSearching && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
              <div className="text-sm text-gray-500 text-center">
                No results found for &quot;{searchQuery}&quot;
              </div>
            </div>
          )}
          </div>

        {/* Spacer for centering */}
        <div className="flex-1"></div>

        {/* Right Section - Notifications & User Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
            {/* Notification Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200"></div>

          {/* User Profile */}
          <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Production Manager</p>
            </div>
          </div>
        </div>

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </header>
  );
};

export default Header;