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
                <span className="text-2xl font-bold" style={{ color }}>{grade}</span>
                <span className="text-sm text-muted-foreground">{score}/100</span>
            </div>
        </div>
    );
}
