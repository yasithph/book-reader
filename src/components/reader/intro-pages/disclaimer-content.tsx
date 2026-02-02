"use client";

interface DisclaimerContentProps {
  textColor: string;
  secondaryColor: string;
}

export function DisclaimerContent({ textColor, secondaryColor }: DisclaimerContentProps) {
  return (
    <div className="text-center max-w-md mx-auto">
      {/* Warning icon */}
      <div className="mb-8">
        <span className="text-5xl">⚠️</span>
      </div>

      {/* Sinhala text */}
      <div className="mb-8">
        <h1
          className="sinhala text-2xl font-medium mb-4"
          style={{ color: textColor }}
        >
          වයස අවුරුදු 18+ පමණක් සඳහා
        </h1>
        <p
          className="sinhala text-base leading-relaxed"
          style={{ color: secondaryColor }}
        >
          මෙම පොත වැඩිහිටියන් සඳහා පමණක් වන අන්තර්ගතය අඩංගු වේ.
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
          className="text-xl font-medium mb-4"
          style={{ color: textColor }}
        >
          FOR AGES 18+ ONLY
        </h2>
        <p
          className="text-base leading-relaxed"
          style={{ color: secondaryColor }}
        >
          This book contains mature content intended for adult readers only.
        </p>
      </div>
    </div>
  );
}
