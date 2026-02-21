import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  category: {
    label: string;
    color: string;
  };
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="text-xs font-medium border"
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        borderColor: `${category.color}80`,
      }}
    >
      {category.label}
    </Badge>
  );
}
