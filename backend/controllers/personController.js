const Person = require("../models/Person");

exports.getPersonDetails = async (req, res) => {
  try {
    const { source, externalId } = req.params;

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
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/person/${externalId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=combined_credits`);
      const tmdbData = await tmdbRes.json();

      if (tmdbData.success === false) return res.status(404).json({ message: "Person not found on TMDB" });

      newPersonData.name = tmdbData.name;
      newPersonData.bio = tmdbData.biography;
      newPersonData.profilePic = tmdbData.profile_path ? `https://image.tmdb.org/t/p/w500${tmdbData.profile_path}` : null;
      
      // Extract top 10 known for items
      if (tmdbData.combined_credits?.cast) {
        knownForExternalIds = tmdbData.combined_credits.cast
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 10)
          .map(item => item.id.toString());
      }
    } else if (source === "jikan") {
      const jikanRes = await fetch(`https://api.jikan.moe/v4/people/${externalId}/full`);
      const jikanJson = await jikanRes.json();
      const jikanData = jikanJson.data;

      if (!jikanData) return res.status(404).json({ message: "Person not found on Jikan" });

      newPersonData.name = jikanData.name;
      newPersonData.bio = jikanData.about;
      newPersonData.profilePic = jikanData.images?.jpg?.image_url;

      // Extract top known for anime
      if (jikanData.anime) {
        knownForExternalIds = jikanData.anime
          .slice(0, 10)
          .map(item => item.anime.mal_id.toString());
      }
    } else {
      return res.status(400).json({ message: "Invalid source" });
    }

    // Upsert into DB
    person = await Person.findOneAndUpdate(
      { source, externalId },
      { $set: newPersonData },
      { new: true, upsert: true }
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
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
