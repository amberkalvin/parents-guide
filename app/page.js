'use client';

import { useState, useEffect, useRef } from 'react';
import { searchMovies, fetchGuide } from '../lib/scraper';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        try {
          const data = await searchMovies(query);
          setResults(data.results || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = async (movie) => {
    setQuery('');
    setResults([]);
    setSelectedMovie(movie);
    setGuideLoading(true);
    setError(null);
    try {
      const data = await fetchGuide(movie.id);
      setGuide(data);
    } catch (err) {
      setError('Could not load the Parents Guide. Please try again.');
    } finally {
      setGuideLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    const s = severity?.toLowerCase() || '';
    if (s.includes('severe')) return 'badge-severe';
    if (s.includes('moderate')) return 'badge-moderate';
    if (s.includes('mild')) return 'badge-mild';
    if (s.includes('none')) return 'badge-none';
    return 'badge-none'; // Default
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative overflow-hidden">

      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center gap-8">

        {/* Header */}
        {!guide && (
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Parents Guide
            </h1>
            <p className="text-gray-400 text-lg">
              Search any movie to view content advisories instantly.
            </p>
          </div>
        )}

        {/* Movie Poster */}
        {selectedMovie && guide && !guideLoading && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              {selectedMovie.image ? (
                <img
                  src={selectedMovie.image}
                  alt={selectedMovie.title}
                  className="relative w-48 md:w-64 rounded-lg shadow-2xl border border-gray-800 transition-transform hover:scale-105 duration-500"
                />
              ) : (
                <div className="relative w-48 md:w-64 aspect-[2/3] bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800 text-gray-500">
                  No Poster Available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className={`w-full relative transition-all duration-500 ${guide ? 'mb-8' : ''}`} ref={searchRef}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center">
              <svg className="w-5 h-5 absolute left-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                className="block w-full p-4 pl-12 text-lg text-white bg-black/80 rounded-lg border border-gray-800 focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500 transition-all shadow-2xl"
                placeholder="Search for a movie..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {loading && (
                <div className="absolute right-4 w-5 h-5 border-t-2 border-yellow-500 rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          {/* Dropdown Results */}
          {results.length > 0 && (
            <ul className="absolute z-50 w-full mt-2 bg-black/90 backdrop-blur-xl border border-gray-800 rounded-lg shadow-2xl max-h-96 overflow-y-auto animate-fade-in divide-y divide-gray-800">
              {results.map((movie) => (
                <li
                  key={movie.id}
                  onClick={() => handleSelect(movie)}
                  className="flex items-center gap-4 p-3 hover:bg-white/10 cursor-pointer transition-colors group"
                >
                  {movie.image ? (
                    <img src={movie.image} alt={movie.title} className="w-10 h-14 object-cover rounded shadow-md group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">N/A</div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-yellow-400 transition-colors">{movie.title}</div>
                    <div className="text-sm text-gray-400">{movie.year} • {movie.type}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Guide Content */}
        {guideLoading && (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-fade-in">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">Fetching advisories...</p>
          </div>
        )}

        {guide && !guideLoading && (
          <div className="w-full space-y-6 animate-fade-in pb-20">
            <div className="flex items-end justify-between border-b border-gray-800 pb-4">
              <h2 className="text-3xl font-bold text-white">{guide.title}</h2>
              <button
                onClick={() => {
                  setGuide(null);
                  setSelectedMovie(null);
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear Result
              </button>
            </div>

            <div className="grid gap-6">
              {guide.guide.map((section) => (
                <div key={section.id} className="glass-panel p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-200">{section.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityClass(section.severity)}`}>
                      {section.severity || 'Unknown'}
                    </span>
                  </div>

                  {section.items && section.items.length > 0 ? (
                    <ul className="space-y-3">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                          <span className="text-yellow-500 mt-1.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No specific details found for this category.</p>
                  )}
                </div>
              ))}

              {guide.guide.length === 0 && (
                <div className="text-center p-8 text-gray-500">
                  No parents guide information found for this title.
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 w-full text-center animate-fade-in">
            {error}
          </div>
        )}

      </div>
    </main>
  );
}
