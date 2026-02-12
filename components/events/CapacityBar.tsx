interface CapacityBarProps {
  current: number;
  total: number;
}

export default function CapacityBar({ current, total }: CapacityBarProps) {
  const percentage = (current / total) * 100;
  
  const getColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-bold ${getTextColor()}`}>
          {current.toLocaleString()} / {total.toLocaleString()}
        </span>
        <span className={`text-xs font-semibold ${getTextColor()}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {percentage >= 90 && (
        <p className="text-xs text-red-500 font-medium mt-1">
          Almost Full! Limited spots remaining
        </p>
      )}
    </div>
  );
}
