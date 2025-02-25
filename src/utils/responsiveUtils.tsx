// src/utils/responsiveUtils.tsx
import React, { useState, useEffect } from "react";

// Define screen size breakpoints
export const breakpoints = {
  sm: 640, // Small devices (phones)
  md: 768, // Medium devices (tablets)
  lg: 1024, // Large devices (desktops)
  xl: 1280, // Extra large devices
};

// Hook to track current screen size
export const useScreenSize = () => {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : breakpoints.lg
  );

  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);

      setScreenSize({
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
      });
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    screenWidth,
    isMobile: screenSize.isMobile,
    isTablet: screenSize.isTablet,
    isDesktop: screenSize.isDesktop,
  };
};

// React context for screen size
const ScreenSizeContext = React.createContext({
  screenWidth: breakpoints.lg,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

// Provider component
export const ScreenSizeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const screenSize = useScreenSize();

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      {children}
    </ScreenSizeContext.Provider>
  );
};

// Hook to use the screen size context
export const useScreenSizeContext = () => React.useContext(ScreenSizeContext);

// HOC to make any component responsive-aware
export const withResponsive = <P extends object>(
  Component: React.ComponentType<
    P & { screenSize: ReturnType<typeof useScreenSize> }
  >
) => {
  return (props: P) => {
    const screenSize = useScreenSize();
    return <Component {...props} screenSize={screenSize} />;
  };
};
