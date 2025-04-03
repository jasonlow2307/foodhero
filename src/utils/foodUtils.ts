import { Visit } from "./models";

export const sanitizeVisitData = (visit: Visit): Visit => {
  // Create a deep copy of the visit object
  const sanitized = { ...visit };

  // Remove undefined values
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  return sanitized;
};
