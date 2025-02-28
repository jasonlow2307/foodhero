import React from "react";
import useFirestoreCollection from "../firebase/useFirestoreCollection";
import useFirestoreWrite from "../firebase/useFirestoreWrite";

const UNSPLASH_ACCESS_KEY = "FlB8RIHBAaH0Td-upGKwADP1DsRPTVWI1jzYAX6SN-0";

export const useUnsplash = () => {
  const { writeData } = useFirestoreWrite();
  const { data } = useFirestoreCollection("images");

  // Add a simple memory cache to prevent duplicate writes in the same session
  const inMemoryCache = React.useRef<Record<string, boolean>>({});

  const fetchUnsplashImage = async (query: string) => {
    // checking Firestore cache data
    if (data) {
      const cachedData = data.find((d: any) => d.query === query);
      if (cachedData) {
        console.log("Using cached data for", query);
        return cachedData.res.results.length > 0
          ? cachedData.res.results[1].urls.small
          : null;
      }
    }

    // Check in-memory cache to prevent duplicate writes
    if (inMemoryCache.current[query]) {
      console.log(
        "Already fetching/written this query in this session:",
        query
      );
      // Return a placeholder until the real data is available
      return null;
    }

    console.log("Fetching image for", query);
    // Mark as being fetched to prevent duplicate writes
    inMemoryCache.current[query] = true;

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&client_id=${UNSPLASH_ACCESS_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const res = await response.json();

      // Check if this exact query has been written while we were fetching
      const freshCheck = data?.find((d: any) => d.query === query);
      if (!freshCheck) {
        console.log("Writing new data to Firestore for", query);
        await writeData("images", { query, res });
      }

      return res.results.length > 0 ? res.results[1].urls.small : null;
    } catch (error) {
      console.error("Error fetching Unsplash image:", error);
      // Remove from memory cache on error so it can be retried
      delete inMemoryCache.current[query];
      return null;
    }
  };

  return { fetchUnsplashImage };
};
