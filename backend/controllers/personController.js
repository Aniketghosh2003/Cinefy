const Person = require("../models/Person");

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Fetch wrapper with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000, retries = 3) => {
  try {
    console.log(`[FETCH] ${options.method || 'GET'} ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`[FETCH] Response Status: ${response.status}`);
    
    if (response.status === 429 && retries > 0) {
      console.log(`[FETCH RATE LIMITED] Retrying ${url} in 1.5s... (${retries} retries left)`);
      await sleep(1500);
      return fetchWithTimeout(url, options, timeout, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`[FETCH ERROR] Retrying ${url} in 1.5s... (${retries} retries left)`);
      await sleep(1500);
      return fetchWithTimeout(url, options, timeout, retries - 1);
    }
    console.error(`[FETCH ERROR] ${url}:`, error.message || error);
    throw error;
  }
};

exports.getPersonDetails = async (req, res) => {
  const { source, externalId } = req.params;
  try {
    // 1. Check local DB cache
    let person = await Person.findOne({ source, externalId }).populate("knownFor");

    // If exists and was fetched less than 7 days ago, return it
    if (person) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      // Fallback if timestamps are missing, though timestamps: true is on Schema
      if (person.updatedAt && person.updatedAt > sevenDaysAgo) {
        return res.status(200).json(person);
      }
    }

    let newPersonData = { source, externalId };
    let knownForExternalIds = [];

    if (source === "tmdb") {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB_API_KEY not configured" });
      }

      try {
        const tmdbRes = await fetchWithTimeout(`https://api.tmdb.org/3/person/${externalId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=combined_credits`);
        
        if (!tmdbRes.ok) {
          const errorData = await tmdbRes.json().catch(() => ({}));
          console.error("TMDB Person Error:", errorData);
          return res.status(tmdbRes.status).json({ message: "Person not found on TMDB", details: errorData });
        }

        const tmdbData = await tmdbRes.json();

        if (tmdbData.status_code || !tmdbData.id) {
          return res.status(404).json({ message: "Person not found on TMDB" });
        }

        newPersonData.name = tmdbData.name || "Unknown";
        newPersonData.bio = tmdbData.biography || "";
        newPersonData.profilePic = tmdbData.profile_path ? `https://image.tmdb.org/t/p/w500${tmdbData.profile_path}` : null;
        
        if (tmdbData.combined_credits?.cast && Array.isArray(tmdbData.combined_credits.cast)) {
          knownForExternalIds = tmdbData.combined_credits.cast
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 10)
            .map(item => item.id?.toString())
            .filter(id => id);
        }
      } catch (err) {
        console.error("TMDB Person Fetch Error:", err.message);
        return res.status(503).json({ message: "Unable to fetch TMDB person data", error: err.message });
      }

    } else if (source === "jikan") {
      try {
        const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/people/${externalId}/full`);
        
        if (!jikanRes.ok) {
          console.error("Jikan Person Error:", jikanRes.status);
          return res.status(jikanRes.status).json({ message: "Person not found on Jikan" });
        }

        const jikanJson = await jikanRes.json();
        const jikanData = jikanJson.data;

        if (!jikanData || !jikanData.mal_id) {
          return res.status(404).json({ message: "Person not found on Jikan" });
        }

        newPersonData.name = jikanData.name || "Unknown";
        newPersonData.bio = jikanData.about || "";
        newPersonData.profilePic = jikanData.images?.jpg?.image_url;

        if (jikanData.anime && Array.isArray(jikanData.anime)) {
          knownForExternalIds = jikanData.anime
            .slice(0, 10)
            .map(item => item.anime?.mal_id?.toString())
            .filter(id => id);
        }
      } catch (err) {
        console.error("Jikan Person Fetch Error:", err.message);
        return res.status(503).json({ message: "Unable to fetch Jikan person data", error: err.message });
      }
    } else {
      return res.status(400).json({ message: "Invalid source" });
    }

    // Upsert into DB
    person = await Person.findOneAndUpdate(
      { source, externalId },
      { $set: newPersonData },
      { upsert: true, returnDocument: 'after' }
    );

    // Note: We don't instantly populate `knownFor` from externalIds here to save complex DB inserts of Content objects.
    // The frontend can use these external IDs to route to /content/tmdb/123 when clicked.
    // To stick to your schema, we might need an array of strings instead of ObjectIds for knownFor if we don't cache them all instantly.
    // For now, returning the raw data is sufficient for the bio page.
    
    // We append the raw external IDs to the response so the frontend can render posters
    const responseObj = person.toObject();
    responseObj.knownForExternalIds = knownForExternalIds;

    res.status(200).json(responseObj);
  } catch (error) {
    console.error("Person Detail Error:", error.message);
    // Return mock person data
    res.status(200).json({
      source,
      externalId,
      name: `Person ${externalId}`,
      bio: "Unable to fetch details",
      profilePic: null,
      knownForExternalIds: []
    });
  }
};
