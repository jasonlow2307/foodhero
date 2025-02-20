import useFirestoreCollection from "../firebase/useFirestoreCollection";
import useFirestoreWrite from "../firebase/useFirestoreWrite";

const UNSPLASH_ACCESS_KEY = "FlB8RIHBAaH0Td-upGKwADP1DsRPTVWI1jzYAX6SN-0";

export const useUnsplash = () => {
  const { writeData } = useFirestoreWrite();
  const { data } = useFirestoreCollection("images");

  const fetchUnsplashImage = async (query: string) => {
    // checking cache data
    if (data) {
      const cachedData = data.find((d: any) => d.query === query);
      if (cachedData) {
        console.log("Using cached data for", query);
        return cachedData.res.results.length > 0
          ? cachedData.res.results[1].urls.small
          : null;
      }
    }
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    const res = await response.json();
    writeData("images", { query, res });
    return res.results.length > 0 ? res.results[1].urls.small : null;
  };
  return { fetchUnsplashImage };
};
