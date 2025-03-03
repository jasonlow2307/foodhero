import React from "react";
import useFirestoreCollection from "../firebase/useFirestoreCollection";
import useFirestoreWrite from "../firebase/useFirestoreWrite";

const UNSPLASH_ACCESS_KEY = "FlB8RIHBAaH0Td-upGKwADP1DsRPTVWI1jzYAX6SN-0";

export const useUnsplash = () => {
  const { writeData } = useFirestoreWrite();
  const { data } = useFirestoreCollection("images");

  // Add a more comprehensive memory cache to prevent duplicate writes in the same session
  const inMemoryCache = React.useRef<Record<string, any>>({});
  // Track pending requests to avoid duplicate fetches
  const pendingRequests = React.useRef<Record<string, Promise<string | null>>>(
    {}
  );

  const fetchUnsplashImage = async (query: string): Promise<string | null> => {
    // First, normalize the query to prevent case-sensitivity issues
    const normalizedQuery = query.toLowerCase().trim();

    // Check if we have a pending request for this query
    if (pendingRequests.current[normalizedQuery]) {
      console.log("Request already in progress for:", normalizedQuery);
      return pendingRequests.current[normalizedQuery];
    }

    // Check in-memory cache first (fastest)
    if (inMemoryCache.current[normalizedQuery]) {
      console.log("Using in-memory cache for:", normalizedQuery);
      return inMemoryCache.current[normalizedQuery];
    }

    // Check Firestore cache next
    if (data) {
      const cachedData = data.find(
        (d: any) => d.query.toLowerCase().trim() === normalizedQuery
      );

      if (cachedData) {
        console.log("Using Firestore cached data for:", normalizedQuery);
        const imageUrl =
          cachedData.res.results.length > 0
            ? cachedData.res.results[1].urls.small
            : null;

        // Store in memory cache for future use
        inMemoryCache.current[normalizedQuery] = imageUrl;
        return imageUrl;
      }
    }

    // Create a promise for this request and store it
    const requestPromise = (async () => {
      console.log("Fetching image for:", normalizedQuery);

      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            normalizedQuery
          )}&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const res = await response.json();
        const imageUrl =
          res.results.length > 0 ? res.results[1].urls.small : null;

        // Store result in memory cache
        inMemoryCache.current[normalizedQuery] = imageUrl;

        // Check if this exact query has been written while we were fetching
        const freshCheck = data?.find(
          (d: any) => d.query.toLowerCase().trim() === normalizedQuery
        );

        if (!freshCheck) {
          console.log("Writing new data to Firestore for:", normalizedQuery);
          await writeData("images", { query: normalizedQuery, res });
        }

        return imageUrl;
      } catch (error) {
        console.error("Error fetching Unsplash image:", error);
        return null;
      } finally {
        // Remove from pending requests when done
        delete pendingRequests.current[normalizedQuery];
      }
    })();

    // Store the promise so parallel calls can use it
    pendingRequests.current[normalizedQuery] = requestPromise;
    return requestPromise;
  };

  return { fetchUnsplashImage };
};
