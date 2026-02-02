"use client";

interface CopyrightContentProps {
  textColor: string;
  secondaryColor: string;
}

export function CopyrightContent({ textColor, secondaryColor }: CopyrightContentProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="text-center max-w-md mx-auto">
      {/* Copyright symbol */}
      <div className="mb-8">
        <span
          className="text-5xl font-serif"
          style={{ color: textColor }}
        >
          ©
        </span>
      </div>

      {/* Sinhala text */}
      <div className="mb-8">
        <h1
          className="sinhala text-xl font-medium mb-2"
          style={{ color: textColor }}
        >
          ප්‍රකාශන හිමිකම {currentYear}
        </h1>
        <p
          className="text-lg font-medium mb-4"
          style={{ color: textColor }}
        >
          Meera
        </p>
        <p
          className="sinhala text-base leading-relaxed"
          style={{ color: secondaryColor }}
        >
          මෙම පොතේ සියලුම අන්තර්ගතයන්ට අයිතිය ඇත. කිසිදු කොටසක් පිටපත් කිරීම, බෙදා හැරීම හෝ නැවත ප්‍රකාශනය කිරීම නීත්‍යානුකූලව තහනම් ය.
        </p>
      </div>

      {/* Divider */}
      <div
        className="w-16 h-px mx-auto mb-8"
        style={{ backgroundColor: `${textColor}20` }}
      />

      {/* English text */}
      <div>
        <h2
          className="text-lg font-medium mb-2"
          style={{ color: textColor }}
        >
          © Copyright {currentYear} Meera
        </h2>
        <p
          className="text-base leading-relaxed"
          style={{ color: secondaryColor }}
        >
          All rights reserved. Unauthorized copying, distribution, or reproduction of any part of this book will result in legal action.
        </p>
      </div>
    </div>
  );
}
