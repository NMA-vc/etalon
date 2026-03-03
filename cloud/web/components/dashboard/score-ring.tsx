"use client";

interface ScoreRingProps {
    score: number;
    grade: string;
    size?: number;
    strokeWidth?: number;
}

const gradeColors: Record<string, string> = {
    A: "#4caf50",
    B: "#8bc34a",
    C: "#ffc107",
    D: "#ff9800",
    F: "#f44336",
};

export function ScoreRing({ score, grade, size = 120, strokeWidth = 8 }: ScoreRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = gradeColors[grade] || "#666";

    // Scale text sizes based on ring size
    const gradeSize = Math.max(12, size * 0.25);
    const scoreSize = Math.max(8, size * 0.12);
    const showScore = size >= 64; // Hide "98/100" on very small rings

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/30"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold leading-none" style={{ color, fontSize: gradeSize }}>{grade}</span>
                {showScore && (
                    <span className="text-muted-foreground leading-none mt-0.5" style={{ fontSize: scoreSize }}>{score}/100</span>
                )}
            </div>
        </div>
    );
}

