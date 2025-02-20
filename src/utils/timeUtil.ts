export const getTimeAgo = (timestamp: {
  seconds: number;
  nanoseconds: number;
}) => {
  const now = new Date();
  const visitDate = new Date(timestamp.seconds * 1000);
  const diffInMs = now.getTime() - visitDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Visited today";
  } else if (diffInDays === 1) {
    return "Visited yesterday";
  } else {
    return `Visited ${diffInDays} days ago`;
  }
};
