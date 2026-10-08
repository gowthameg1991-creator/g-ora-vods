import React, { useState } from 'react';
import { Sparkles, Check, Search, ChevronDown, Star } from 'lucide-react';
import { EMOTIONS, EmotionOption } from '../types/tts';

interface EmotionSelectorProps {
  selectedEmotion: string;
  onChange: (emotion: EmotionOption) => void;
  favoriteEmotions?: string[];
  onToggleFavorite?: (emotionId: string) => void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onChange,
  favoriteEmotions = [],
  onToggleFavorite,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const currentEmotion =
    EMOTIONS.find((e) => e.name.toLowerCase() === selectedEmotion.toLowerCase() || e.id === selectedEmotion) ||
    EMOTIONS[0];

  const isCurrentFavorited = favoriteEmotions.includes(currentEmotion.id);

  const categories = [
    '⭐ Favorites',
    'All',
    'Mystery & Suspense',
    'High Energy',
    'Calm & Warm',
    'Dramatic',
    'Professional',
  ];

  const filteredEmotions = EMOTIONS.filter((e) => {
    let matchesCategory = true;
    if (activeCategory === '⭐ Favorites') {
      matchesCategory = favoriteEmotions.includes(e.id);
    } else if (activeCategory !== 'All') {
      matchesCategory = e.category === activeCategory;
    }

    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.bestUse.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative">
      <div className="label justify-between mb-1.5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Emotion & Style Delivery
        </span>
        <span className="font-mono-code text-[0.62rem] text-[var(--ink-muted)]">
          {EMOTIONS.length} Styles
        </span>
      </div>

      {/* Main Selector Button */}
      <div className="rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f14] hover:border-[rgba(226,232,240,0.25)] transition flex items-stretch overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 text-left p-3 transition flex items-center justify-between gap-3 focus:outline-none"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--ink)] text-sm truncate flex items-center gap-1.5">
                {isCurrentFavorited && (
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                )}
                {currentEmotion.name}
              </span>
              <span className="font-mono-code text-[0.62rem] uppercase tracking-wider px-1.5 py-0.5 bg-[var(--ink-faint)] text-[var(--ink-muted)] rounded-[2px] shrink-0">
                {currentEmotion.category}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">{currentEmotion.bestUse}</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[var(--ink-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Quick Star Favorite Toggle on Main Card */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(currentEmotion.id);
            }}
            className={`px-3 border-l border-[var(--ink-faint)] transition flex items-center justify-center hover:bg-white/5 ${
              isCurrentFavorited
                ? 'text-amber-400'
                : 'text-slate-500 hover:text-amber-400'
            }`}
            title={isCurrentFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`h-4 w-4 ${isCurrentFavorited ? 'fill-amber-400' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-[4px] border border-[var(--ink-faint)] bg-[#0d0f15] shadow-2xl p-2.5 max-h-[400px] flex flex-col backdrop-blur-xl">
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--ink-muted)]" />
              <input
                type="text"
                placeholder="Search emotions (e.g. Mysterious, Playful, Tense)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[2px] bg-black/40 border border-[var(--ink-faint)] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[var(--ink-muted)] focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--ink-faint)] mb-2">
              {categories.map((cat) => {
                const isFavTab = cat === '⭐ Favorites';
                const count = isFavTab ? favoriteEmotions.length : undefined;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`btn btn-secondary py-1 px-2.5 text-[0.62rem] rounded-[2px] whitespace-nowrap transition flex items-center gap-1 ${
                      activeCategory === cat
                        ? isFavTab
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'active'
                        : ''
                    }`}
                  >
                    <span>{cat}</span>
                    {count !== undefined && count > 0 && (
                      <span className="font-mono-code text-[9px] opacity-80">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Options List */}
            <div className="overflow-y-auto space-y-1 flex-1 pr-1">
              {filteredEmotions.length === 0 ? (
                <div className="p-5 text-center text-xs text-[var(--ink-muted)]">
                  {activeCategory === '⭐ Favorites' ? (
                    <div className="space-y-1">
                      <Star className="h-5 w-5 text-amber-400/50 mx-auto mb-1" />
                      <p className="font-semibold text-white">No favorite emotions yet</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Click the star icon to pin emotions to favorites.
                      </p>
                    </div>
                  ) : (
                    'No matching emotions found'
                  )}
                </div>
              ) : (
                filteredEmotions.map((emotion) => {
                  const isSelected = emotion.name.toLowerCase() === currentEmotion.name.toLowerCase();
                  const isFav = favoriteEmotions.includes(emotion.id);

                  return (
                    <div
                      key={emotion.id}
                      onClick={() => {
                        onChange(emotion);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left rounded-[3px] p-2 transition flex items-center justify-between gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                          : 'border-transparent hover:border-[var(--ink-faint)] hover:bg-white/5 text-[var(--ink)]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-white flex items-center gap-1">
                            {isFav && (
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                            {emotion.name}
                          </span>
                          <span className="font-mono-code text-[0.6rem] px-1 py-0.2 bg-white/5 text-[var(--ink-muted)] rounded-[2px]">
                            {emotion.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ink-muted)] line-clamp-1 mt-0.5">
                          {emotion.bestUse}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(emotion.id);
                            }}
                            className={`p-1 rounded transition hover:bg-white/10 ${
                              isFav
                                ? 'text-amber-400'
                                : 'text-slate-600 hover:text-amber-400'
                            }`}
                            title={isFav ? 'Remove from favorites' : 'Star as favorite'}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400' : ''}`}
                            />
                          </button>
                        )}

                        {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
