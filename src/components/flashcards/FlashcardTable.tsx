'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashcardTableProps {
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    category?: string;
    tags?: string[];
    masteryLevel: 'New' | 'Learning' | 'Familiar' | 'Mastered';
    reviewCount: number;
    lastReviewed?: Date;
  }>;
}

export function FlashcardTable({ flashcards }: FlashcardTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMastery, setFilterMastery] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'front' | 'mastery' | 'lastReviewed'>('front');

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'New': return 'text-gray-600 bg-gray-100';
      case 'Learning': return 'text-yellow-700 bg-yellow-100';
      case 'Familiar': return 'text-blue-700 bg-blue-100';
      case 'Mastered': return 'text-green-700 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case 'Mastered': return <Star className="w-4 h-4 fill-current" />;
      default: return null;
    }
  };

  const formatLastReviewed = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredAndSortedCards = flashcards
    .filter(card => {
      const matchesSearch = card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.back.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMastery = filterMastery === 'all' || card.masteryLevel === filterMastery;
      return matchesSearch && matchesMastery;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'front':
          return a.front.localeCompare(b.front);
        case 'mastery':
          const masteryOrder = { 'New': 0, 'Learning': 1, 'Familiar': 2, 'Mastered': 3 };
          return masteryOrder[a.masteryLevel] - masteryOrder[b.masteryLevel];
        case 'lastReviewed':
          const aDate = a.lastReviewed ? new Date(a.lastReviewed) : new Date(0);
          const bDate = b.lastReviewed ? new Date(b.lastReviewed) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="w-full">
      {/* Search and Filter Controls */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search flashcards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Mastery Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterMastery}
              onChange={(e) => setFilterMastery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Cards</option>
              <option value="New">New</option>
              <option value="Learning">Learning</option>
              <option value="Familiar">Familiar</option>
              <option value="Mastered">Mastered</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="front">Question</option>
              <option value="mastery">Mastery Level</option>
              <option value="lastReviewed">Last Reviewed</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedCards.length} of {flashcards.length} cards
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Question</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Answer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Last Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedCards.map((card, index) => (
                <motion.tr
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 leading-relaxed">
                      {card.front}
                    </div>
                    {card.tags && card.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {card.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 leading-relaxed max-w-md">
                      {card.back}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getMasteryColor(card.masteryLevel)}`}>
                        {getMasteryIcon(card.masteryLevel)}
                        {card.masteryLevel}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({card.reviewCount} reviews)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatLastReviewed(card.lastReviewed)}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedCards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No flashcards found</div>
            <div className="text-sm text-gray-400">
              {searchTerm || filterMastery !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No flashcards available for this topic'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}