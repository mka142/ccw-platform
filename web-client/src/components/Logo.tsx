import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  fill?: string;
  title?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 32,
  fill = "currentColor",
  title = "Logo",
  ...props
}) => {
  const sizeAttr = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      width={sizeAttr}
      height={sizeAttr}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      role={props.role ?? "img"}
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      <path
        fill={fill}
        d="M327.392,89.817C270.288,62.244,222.046,0,222.046,0v41.456v325.214c-17.83-6.55-38.908-8.486-60.632-4.292
        c-52.168,10.023-88.075,51.179-80.247,91.872c7.851,40.714,56.48,65.578,108.638,55.512c46.306-8.915,79.741-42.349,81.171-78.257
        h0.29V148.513c149.815,18.303,125.209,124.349,114.842,155.439C472.464,207.23,427.556,138.158,327.392,89.817z"
      />
    </svg>
  );
};

export default Logo;
