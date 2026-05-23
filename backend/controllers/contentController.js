const Content = require("../models/Content");

// --- Helper Functions for API calls ---

// Mock data for when external APIs are unavailable
const MOCK_TRENDING_DATA = [
  { source: "tmdb", externalId: "550", type: "movie", title: "Fight Club", poster: "https://image.tmdb.org/t/p/w500/p64VOm7S6R9YnYzvtATYTnIwzKV.jpg", rating: 8.8, popularity: 82.5 },
  { source: "tmdb", externalId: "278", type: "movie", title: "The Shawshank Redemption", poster: "https://image.tmdb.org/t/p/w500/q6725aR8Zs4IwGMoFAh0AwDCx37.jpg", rating: 9.3, popularity: 88.2 },
  { source: "tmdb", externalId: "238", type: "movie", title: "The Godfather", poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1cjexvs.jpg", rating: 9.2, popularity: 85.0 },
  { source: "jikan", externalId: "5", type: "anime", title: "Cowboy Bebop", poster: "https://cdn.myanimelist.net/images/anime/6/73274.jpg", rating: 8.7, popularity: 95000 }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Wrapper for fetch with timeout and better error handling
const fetchWithTimeout = async (url, options = {}, timeout = 10000, retries = 3) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 429 && retries > 0) {
      await sleep(1500);
      return fetchWithTimeout(url, options, timeout, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(1500);
      return fetchWithTimeout(url, options, timeout, retries - 1);
    }
    const safeUrl = url.split('?')[0];
    console.error(`[FETCH FAILED] ${safeUrl} - Error:`, error.name, error.message);
    throw new Error(`Fetch failed for ${safeUrl}: ${error.message}`);
  }
};

const generateMoodWithGrok = async (title, description) => {
  try {
    if (!process.env.GROK_API_KEY) return ["Unknown"];
    
    const response = await fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: "You are a movie and anime expert. Given a title and description, return exactly 3 mood keywords in a comma-separated string (e.g. 'Mind-Blowing,Emotional,Dark'). Do not return any other text." },
          { role: "user", content: `Title: ${title}\nDescription: ${description}` }
        ]
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      const moodString = data.choices[0].message.content;
      return moodString.split(",").map(m => m.trim());
    }
    return ["Unknown"];
  } catch (error) {
    console.error("Grok API Error:", error.message);
    return ["Unknown"];
  }
};

// --- Endpoints ---

// Get Trending (Direct from TMDB and Jikan)
exports.getTrending = async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(200).json(MOCK_TRENDING_DATA);
    }

    // 1. Fetch TMDB Trending
    let formattedTmdb = [];
    try {
      const tmdbRes = await fetchWithTimeout(`https://api.tmdb.org/3/trending/all/day?api_key=${process.env.TMDB_API_KEY}`);
      
      if (!tmdbRes.ok) {
        const errorData = await tmdbRes.json().catch(() => ({}));
        console.error("TMDB API Error:", errorData);
      } else {
        const tmdbData = await tmdbRes.json();
        
        formattedTmdb = (tmdbData.results || []).map(item => ({
          source: "tmdb",
          externalId: item.id?.toString(),
          type: item.media_type === "tv" ? "tv" : "movie",
          title: item.title || item.name,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          rating: item.vote_average,
          popularity: item.popularity
        })).filter(item => item.externalId && item.poster);
      }
    } catch (err) {
      console.error("TMDB Trending Error:", err.message);
    }

    // 2. Fetch Jikan Trending
    let formattedJikan = [];
    try {
      const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/seasons/now`);
      
      if (jikanRes.ok) {
        const jikanData = await jikanRes.json();
        
        formattedJikan = (jikanData.data || []).map(item => ({
          source: "jikan",
          externalId: item.mal_id?.toString(),
          type: "anime",
          title: item.title,
          poster: item.images?.jpg?.image_url,
          rating: item.score,
          popularity: item.members
        })).filter(item => item.externalId && item.poster);
      }
    } catch (err) {
      console.error("Jikan Trending Error:", err.message);
    }

    // Merge and slice top 5 from each
    const combined = [...formattedTmdb.slice(0, 5), ...formattedJikan.slice(0, 5)];

    if (combined.length === 0) {
      return res.status(200).json(MOCK_TRENDING_DATA);
    }

    res.status(200).json(combined);
  } catch (error) {
    console.error("Trending Error:", error);
    res.status(200).json(MOCK_TRENDING_DATA); // Return mock data on any error
  }
};

// Search Content (Direct from TMDB and Jikan)
exports.searchContent = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    if (!process.env.TMDB_API_KEY) {
      return res.status(200).json([]);
    }

    // Parallel fetches with error handling
    let formattedTmdb = [];
    let formattedJikan = [];

    try {
      const tmdbRes = await fetchWithTimeout(`https://api.tmdb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${process.env.TMDB_API_KEY}`);
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        formattedTmdb = (tmdbData.results || []).filter(item => item.media_type !== "person" && item.poster_path).map(item => ({
          source: "tmdb",
          externalId: item.id?.toString(),
          type: item.media_type === "tv" ? "tv" : "movie",
          title: item.title || item.name,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          rating: item.vote_average || 0,
        }));
      }
    } catch (err) {
      console.error("TMDB Search Error:", err.message);
    }

    try {
      const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}`);
      if (jikanRes.ok) {
        const jikanData = await jikanRes.json();
        formattedJikan = (jikanData.data || []).map(item => ({
          source: "jikan",
          externalId: item.mal_id?.toString(),
          type: "anime",
          title: item.title,
          poster: item.images?.jpg?.image_url,
          rating: item.score || 0,
        })).filter(item => item.poster);
      }
    } catch (err) {
      console.error("Jikan Search Error:", err.message);
      // Check mock data
      if (MOCK_SEARCH_RESULTS[q.toLowerCase()]) {
        return res.status(200).json(MOCK_SEARCH_RESULTS[q.toLowerCase()]);
      }
    }

    const results = [...formattedTmdb, ...formattedJikan];
    res.status(200).json(results);
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(200).json([]); // Return empty array instead of error
  }
};

// Get Content Details (LAZY CACHING LOGIC)
exports.getContentDetails = async (req, res) => {
  const { source, externalId } = req.params;
  try {
    // 1. Check local DB cache
    let content = await Content.findOne({ source, externalId });

    // If exists and was fetched less than 7 days ago, return it
    if (content) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (content.lastFetched > sevenDaysAgo) {
        return res.status(200).json(content);
      }
    }

    // 2. Not in DB or stale -> Fetch from External API
    let newContentData = { source, externalId };

    if (source === "tmdb") {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB_API_KEY not configured" });
      }

      const type = req.query.type || "movie"; 
      
      try {
        const tmdbRes = await fetchWithTimeout(`https://api.tmdb.org/3/${type}/${externalId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos`);
        
        if (!tmdbRes.ok) {
          const errorData = await tmdbRes.json().catch(() => ({}));
          console.error("TMDB Detail Error:", errorData);
          return res.status(tmdbRes.status).json({ message: "TMDB Content not found", details: errorData });
        }

        const tmdbData = await tmdbRes.json();

        if (tmdbData.status_code || !tmdbData.id) {
          return res.status(404).json({ message: "TMDB Content not found" });
        }

        newContentData.type = type;
        newContentData.title = tmdbData.title || tmdbData.name || "Unknown";
        newContentData.description = tmdbData.overview || "";
        newContentData.poster = tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null;
        newContentData.backdrop = tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : null;
        newContentData.genres = tmdbData.genres?.map(g => g.name) || [];
        newContentData.releaseDate = tmdbData.release_date || tmdbData.first_air_date;
        newContentData.rating = tmdbData.vote_average || 0;
        newContentData.language = tmdbData.spoken_languages?.map(l => l.english_name) || [];
        
        const trailer = tmdbData.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) newContentData.trailer = `https://www.youtube.com/watch?v=${trailer.key}`;
      } catch (err) {
        console.error("TMDB Detail Fetch Error:", err.message);
        return res.status(503).json({ message: "Unable to fetch TMDB content", error: err.message });
      }

    } else if (source === "jikan") {
      try {
        const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${externalId}/full`);
        
        if (!jikanRes.ok) {
          console.error("Jikan Detail Error:", jikanRes.status);
          return res.status(jikanRes.status).json({ message: "Jikan Content not found" });
        }

        const jikanJson = await jikanRes.json();
        const jikanData = jikanJson.data;

        if (!jikanData || !jikanData.mal_id) {
          return res.status(404).json({ message: "Jikan Content not found" });
        }

        newContentData.type = "anime";
        newContentData.title = jikanData.title || "Unknown";
        newContentData.description = jikanData.synopsis || "";
        newContentData.poster = jikanData.images?.jpg?.large_image_url;
        newContentData.genres = jikanData.genres?.map(g => g.name) || [];
        if (jikanData.aired?.from) newContentData.releaseDate = jikanData.aired.from;
        newContentData.rating = jikanData.score || 0;
        newContentData.language = ["Japanese"];
        if (jikanData.trailer?.url) newContentData.trailer = jikanData.trailer.url;
      } catch (err) {
        console.error("Jikan Detail Fetch Error:", err.message);
        return res.status(503).json({ message: "Unable to fetch Jikan content", error: err.message });
      }
    } else {
      return res.status(400).json({ message: "Invalid source" });
    }

    // 3. Generate Mood via Grok AI
    newContentData.mood = await generateMoodWithGrok(newContentData.title, newContentData.description);
    newContentData.lastFetched = Date.now();

    // 4. Upsert (Save to MongoDB Cache Layer)
    content = await Content.findOneAndUpdate(
      { source, externalId },
      { $set: newContentData },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json(content);
  } catch (error) {
    console.error("Content Detail Error:", error);
    // Return mock data with basic info if available
    res.status(200).json({
      source,
      externalId,
      title: `Content ${externalId}`,
      description: "Unable to fetch details",
      poster: null,
      rating: 0,
      genres: [],
      type: "movie",
      mood: ["Unknown"]
    });
  }
};

// Local DB endpoints (unchanged, just use Content.find)
exports.getRecommendations = async (req, res) => {
  try {
    const { genre, mood, minRating, minYear, type } = req.query;
    const query = {};

    if (type) query.type = type;
    if (genre) query.genres = { $in: genre.split(',') }; 
    if (mood) query.mood = { $in: mood.split(',') };
    
    if (minRating || minYear) {
      query.$and = [];
      if (minRating) query.$and.push({ rating: { $gte: Number(minRating) } });
      if (minYear) {
        query.$and.push({ releaseDate: { $gte: new Date(`${minYear}-01-01`) } });
      }
    }

    const recommendations = await Content.find(query).sort({ rating: -1 }).limit(20);
    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Helper to format TMDB arrays
const formatTmdbArray = (results, type) => {
  return (results || []).map(item => ({
    source: "tmdb",
    externalId: item.id.toString(),
    type: item.media_type || type, // fallback to passed type
    title: item.title || item.name,
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    rating: item.vote_average,
  }));
};

// Helper to format Jikan arrays
const formatJikanArray = (data) => {
  return (data || []).map(item => ({
    source: "jikan",
    externalId: item.mal_id.toString(),
    type: "anime",
    title: item.title,
    poster: item.images?.jpg?.image_url,
    rating: item.score,
  }));
};

const safeFetchAndFormat = async (url, formatFn, typeArg) => {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`Fetch failed for ${url}: ${response.status}`);
      return [];
    }
    const json = await response.json();
    return formatFn(json.results || json.data || [], typeArg);
  } catch (e) {
    console.error("Fetch failed for", url, e.message);
    return [];
  }
};

exports.getTop = async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(200).json(MOCK_TRENDING_DATA);
    }

    const { type } = req.query;
    let movieTvResults = [];
    let animeResults = [];
    const limit = type ? 20 : 5;

    if (!type || type === "movie") {
      movieTvResults = [...movieTvResults, ...(await safeFetchAndFormat(`https://api.tmdb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "movie"))];
    }
    if (!type || type === "tv") {
      movieTvResults = [...movieTvResults, ...(await safeFetchAndFormat(`https://api.tmdb.org/3/tv/top_rated?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "tv"))];
    }
    if (!type || type === "anime") {
      animeResults = await safeFetchAndFormat(`https://api.jikan.moe/v4/top/anime`, formatJikanArray);
    }

    movieTvResults.sort((a, b) => b.rating - a.rating);
    const combined = [...movieTvResults.slice(0, limit), ...animeResults.slice(0, limit)];

    if (combined.length === 0) {
      return res.status(200).json(MOCK_TRENDING_DATA);
    }

    res.status(200).json(combined);
  } catch (error) {
    console.error("Get Top Error:", error.message);
    res.status(200).json(MOCK_TRENDING_DATA);
  }
};

const getTodaysAnime = async () => {
  try {
    const response = await fetchWithTimeout(`https://api.jikan.moe/v4/seasons/now`);
    if (!response.ok) return [];
    const json = await response.json();
    const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    const today = days[new Date().getDay()];
    const todaysAnime = (json.data || []).filter(anime => anime.broadcast?.day === today);
    return formatJikanArray(todaysAnime);
  } catch (e) {
    return [];
  }
};

exports.getOngoing = async (req, res) => {
  try {
    if (!process.env.TMDB_API_KEY) {
      return res.status(200).json(MOCK_TRENDING_DATA);
    }

    const { type } = req.query;
    let movieTvResults = [];
    let animeResults = [];
    const limit = type ? 20 : 5;

    if (!type || type === "movie") {
      movieTvResults = [...movieTvResults, ...(await safeFetchAndFormat(`https://api.tmdb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "movie"))];
    }
    if (!type || type === "tv") {
      movieTvResults = [...movieTvResults, ...(await safeFetchAndFormat(`https://api.tmdb.org/3/tv/on_the_air?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "tv"))];
    }
    if (!type || type === "anime") {
      animeResults = await getTodaysAnime();
      if (animeResults.length === 0) {
        animeResults = await safeFetchAndFormat(`https://api.jikan.moe/v4/seasons/now`, formatJikanArray);
      }
    }

    const combined = [...movieTvResults.slice(0, limit), ...animeResults.slice(0, limit)];

    if (combined.length === 0) {
      return res.status(200).json(MOCK_TRENDING_DATA);
    }

    res.status(200).json(combined);
  } catch (error) {
    console.error("Get Ongoing Error:", error.message);
    res.status(200).json(MOCK_TRENDING_DATA);
  }
};

exports.getUpcoming = async (req, res) => {
  try {
    const { type } = req.query;
    let movieTvResults = [];
    let animeResults = [];
    const limit = type ? 20 : 5;

    if (!type || type === "movie") {
      movieTvResults = [...movieTvResults, ...(await safeFetchAndFormat(`https://api.tmdb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "movie"))];
    }
    if (!type || type === "anime") {
      animeResults = await safeFetchAndFormat(`https://api.jikan.moe/v4/seasons/upcoming`, formatJikanArray);
    }

    res.status(200).json([...movieTvResults.slice(0, limit), ...animeResults.slice(0, limit)]);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
