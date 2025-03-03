import { useTheme } from "../../contexts/ThemeContext";

function Footer() {
  const { darkMode } = useTheme();

  return (
    <footer
      className={`py-8 sm:py-10 ${
        darkMode ? "bg-gray-900" : "bg-gray-800"
      } text-white`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Food Waste Hero 🌱
            </h2>
            <p
              className={`text-sm sm:text-base ${
                darkMode ? "text-gray-400" : "text-gray-300"
              }`}
            >
              Track your portions, save the planet!
            </p>
          </div>
        </div>
        <div
          className={`mt-6 sm:mt-8 pt-6 sm:pt-8 border-t ${
            darkMode ? "border-gray-800" : "border-gray-700"
          } text-center text-gray-500 text-sm`}
        >
          <p>
            © {new Date().getFullYear()} Food Waste Hero. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
