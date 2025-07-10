import * as React from "react";

export interface SliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ min = 0, max = 100, step = 1, value, ...props }, ref) => {
    // Always vertical, always fader style
    const scaleLabels = Array.from({ length: 11 }, (_, i) => i * 1).reverse();
    const sliderValue = value === undefined ? min : value;
    return (
      <div className="relative flex flex-col items-center justify-center h-[60vh] min-h-[320px] max-h-[700px] w-24 mx-auto">
        {/* HTML SCALE (left of slider) */}
        <div
          className="absolute left-0 top-0 py-[65px] bottom-0 flex flex-col justify-between h-full z-10 pr-2 select-none pointer-events-none"
          style={{ width: "2.5rem" }}
        >
          {scaleLabels.map((label) => (
            <span
              key={label}
              className="text-xs text-gray-500 dark:text-gray-400 text-left"
              style={{ lineHeight: 1, height: "1em" }}
            >
              {label}
            </span>
          ))}
        </div>
        {/* SLIDER INPUT */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          ref={ref}
          value={sliderValue}
          className={
            "slider-vertical z-20 relative bg-gray-400/80 rounded-lg appearance-none cursor-pointer accent-field-selected focus:outline-none focus:ring-2 focus:ring-field-ring transition-all"
          }
          style={{
            writingMode: "vertical-lr",
            WebkitAppearance: "slider-vertical",
            position: "relative",
            height: "100%",
            background:
              "linear-gradient(to top, var(--color-primary, #7ea6e6) 0%, var(--color-primary, #7ea6e6) 100%)",
          }}
          {...props}
        />
        <style>{`
          input.slider-vertical {
            width: 16px;
            height: 100%;
            writing-mode: vertical-lr;
            -webkit-appearance: none;
            appearance: none;
            margin: 0;
            padding: 0;
          }
          input.slider-vertical::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            background: none;
            border: none;
            width: 62px;
            height: 130px;
            background-image: url('/svg-fader-slider-holder.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: grab;
            margin-left: -23px;
            margin-right: -23px;
          }
          input.slider-vertical::-moz-range-thumb {
            background: none;
            border: none;
            width: 62px;
            height: 130px;
            background-image: url('/svg-fader-slider-holder.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: grab;
          }
          input.slider-vertical::-ms-thumb {
            background: none;
            border: none;
            width: 62px;
            height: 130px;
            background-image: url('/svg-fader-slider-holder.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: grab;
          }
          input.slider-vertical:focus::-webkit-slider-thumb {
            outline: 2px solid var(--color-field-ring, #7ea6e6);
          }
          input.slider-vertical::-webkit-slider-runnable-track {
            background: linear-gradient(to top, var(--color-primary, #7ea6e6) 0%, var(--color-primary, #7ea6e6) 100%);
            border-radius: 8px;
            width: 16px;
            height: 100%;
          }
          input.slider-vertical::-ms-fill-lower,
          input.slider-vertical::-ms-fill-upper {
            background: transparent;
          }
        `}</style>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
