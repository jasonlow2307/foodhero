const UNSPLASH_ACCESS_KEY = "FlB8RIHBAaH0Td-upGKwADP1DsRPTVWI1jzYAX6SN-0";

export const fetchUnsplashImage = async (query: string) => {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&client_id=${UNSPLASH_ACCESS_KEY}`
  );
  const data = await response.json();
  return data.results.length > 0 ? data.results[0].urls.small : null;
};
