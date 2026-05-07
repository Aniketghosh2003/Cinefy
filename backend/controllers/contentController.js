const Content = require("../models/Content");

// --- Helper Functions for API calls ---

const generateMoodWithGrok = async (title, description) => {
  try {
    if (!process.env.GROK_API_KEY) return ["Unknown"];
    
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
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
    console.error("Grok API Error:", error);
    return ["Unknown"];
  }
};

// --- Endpoints ---

// Get Trending (Direct from TMDB and Jikan)
exports.getTrending = async (req, res) => {
  try {
    // 1. Fetch TMDB Trending
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${process.env.TMDB_API_KEY}`);
    const tmdbData = await tmdbRes.json();
    
    const formattedTmdb = (tmdbData.results || []).map(item => ({
      source: "tmdb",
      externalId: item.id.toString(),
      type: item.media_type === "tv" ? "tv" : "movie",
      title: item.title || item.name,
      poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
      rating: item.vote_average,
      popularity: item.popularity
    }));

    // 2. Fetch Jikan Trending
    const jikanRes = await fetch(`https://api.jikan.moe/v4/top/anime`);
    const jikanData = await jikanRes.json();
    
    const formattedJikan = (jikanData.data || []).map(item => ({
      source: "jikan",
      externalId: item.mal_id.toString(),
      type: "anime",
      title: item.title,
      poster: item.images?.jpg?.image_url,
      rating: item.score,
      popularity: item.members // Using members as popularity metric for sorting
    }));

    // Merge and sort
    const combined = [...formattedTmdb, ...formattedJikan]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20); // Top 20

    res.status(200).json(combined);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trending", error: error.message });
  }
};

// Search Content (Direct from TMDB and Jikan)
exports.searchContent = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    // Parallel fetches
    const [tmdbRes, jikanRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${process.env.TMDB_API_KEY}`),
      fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}`)
    ]);

    const tmdbData = await tmdbRes.json();
    const jikanData = await jikanRes.json();

    const formattedTmdb = (tmdbData.results || []).filter(item => item.media_type !== "person").map(item => ({
      source: "tmdb",
      externalId: item.id.toString(),
      type: item.media_type === "tv" ? "tv" : "movie",
      title: item.title || item.name,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      rating: item.vote_average,
    }));

    const formattedJikan = (jikanData.data || []).map(item => ({
      source: "jikan",
      externalId: item.mal_id.toString(),
      type: "anime",
      title: item.title,
      poster: item.images?.jpg?.image_url,
      rating: item.score,
    }));

    res.status(200).json([...formattedTmdb, ...formattedJikan]);
  } catch (error) {
    res.status(500).json({ message: "Search Error", error: error.message });
  }
};

// Get Content Details (LAZY CACHING LOGIC)
exports.getContentDetails = async (req, res) => {
  try {
    const { source, externalId } = req.params;

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
      // First, we need to know if it's a movie or tv to hit the right endpoint
      // We can use the multi search to find out, or assume from frontend (better to pass type in query)
      // Let's assume we pass ?type=movie or tv
      const type = req.query.type || "movie"; 
      
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${externalId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos`);
      const tmdbData = await tmdbRes.json();

      if (tmdbData.success === false) return res.status(404).json({ message: "TMDB Content not found" });

      newContentData.type = type;
      newContentData.title = tmdbData.title || tmdbData.name;
      newContentData.description = tmdbData.overview;
      newContentData.poster = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
      newContentData.backdrop = `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`;
      newContentData.genres = tmdbData.genres.map(g => g.name);
      newContentData.releaseDate = tmdbData.release_date || tmdbData.first_air_date;
      newContentData.rating = tmdbData.vote_average;
      newContentData.language = tmdbData.spoken_languages.map(l => l.english_name);
      
      // Get Trailer
      const trailer = tmdbData.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) newContentData.trailer = `https://www.youtube.com/watch?v=${trailer.key}`;

    } else if (source === "jikan") {
      const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${externalId}/full`);
      const jikanJson = await jikanRes.json();
      const jikanData = jikanJson.data;

      if (!jikanData) return res.status(404).json({ message: "Jikan Content not found" });

      newContentData.type = "anime";
      newContentData.title = jikanData.title;
      newContentData.description = jikanData.synopsis;
      newContentData.poster = jikanData.images.jpg.large_image_url;
      newContentData.genres = jikanData.genres.map(g => g.name);
      if (jikanData.aired?.from) newContentData.releaseDate = jikanData.aired.from;
      newContentData.rating = jikanData.score;
      newContentData.language = ["Japanese"];
      if (jikanData.trailer?.url) newContentData.trailer = jikanData.trailer.url;
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
      { new: true, upsert: true }
    );

    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
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
    const response = await fetch(url);
    const json = await response.json();
    return formatFn(json.results || json.data || [], typeArg);
  } catch (e) {
    console.error("Fetch failed for", url, e.message);
    return [];
  }
};

exports.getTop = async (req, res) => {
  try {
    const { type } = req.query;
    let results = [];

    if (!type || type === "movie") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "movie"))];
    }
    if (!type || type === "tv") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.themoviedb.org/3/tv/top_rated?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "tv"))];
    }
    if (!type || type === "anime") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.jikan.moe/v4/top/anime`, formatJikanArray))];
    }

    results.sort((a, b) => b.rating - a.rating);
    res.status(200).json(results.slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getOngoing = async (req, res) => {
  try {
    const { type } = req.query;
    let results = [];

    if (!type || type === "movie") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "movie"))];
    }
    if (!type || type === "tv") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "tv"))];
    }
    if (!type || type === "anime") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.jikan.moe/v4/seasons/now`, formatJikanArray))];
    }

    res.status(200).json(results.slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getUpcoming = async (req, res) => {
  try {
    const { type } = req.query;
    let results = [];

    if (!type || type === "movie") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}`, formatTmdbArray, "movie"))];
    }
    if (!type || type === "anime") {
      results = [...results, ...(await safeFetchAndFormat(`https://api.jikan.moe/v4/seasons/upcoming`, formatJikanArray))];
    }

    res.status(200).json(results.slice(0, 20));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
