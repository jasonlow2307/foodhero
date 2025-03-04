/**
 * Generates a random 6-letter uppercase code for group identification
 * @returns {string} A 6-letter uppercase code
 */
export const generateGroupCode = (): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";

  // Generate 6 random uppercase letters
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    code += letters[randomIndex];
  }

  return code;
};
