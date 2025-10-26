import { useEffect } from "react";

/**
 * Hook to smoothly transition body background color
 * @param color - CSS color value (hex, rgb, hsl, named color, etc.)
 * @param duration - Transition duration in milliseconds (default: 500ms)
 */
export function useBackgroundColor(color: string, duration: number = 500) {
  useEffect(() => {
    // Store original background color
    const originalColor = document.body.style.backgroundColor;
    const originalTransition = document.body.style.transition;

    // Set transition
    document.body.style.transition = `background-color ${duration}ms ease-in-out`;

    // Apply new color
    document.body.style.backgroundColor = color;

    // Cleanup function to restore original values on unmount
    return () => {
      document.body.style.backgroundColor = originalColor;
      document.body.style.transition = originalTransition;
    };
  }, [color, duration]);
}

/**
 * Alternative version that returns a setter function
 * Useful when you want to control when the color changes
 */
export function useBackgroundColorSetter(duration: number = 500) {
  const setBackgroundColor = (color: string) => {
    const body = document.body;
    
    // Ensure transition is set
    if (!body.style.transition.includes("background-color")) {
      body.style.transition = `background-color ${duration}ms ease-in-out`;
    }
    
    // Apply new color
    body.style.backgroundColor = color;
  };

  useEffect(() => {
    // Set initial transition on mount
    const originalTransition = document.body.style.transition;
    document.body.style.transition = `background-color ${duration}ms ease-in-out`;

    // Cleanup
    return () => {
      document.body.style.transition = originalTransition;
    };
  }, [duration]);

  return setBackgroundColor;
}
