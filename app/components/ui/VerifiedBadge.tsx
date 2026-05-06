import { BadgeCheck } from 'lucide-react';

type VerifiedBadgeProps = {
    isVerified: boolean;
};

export default function VerifiedBadge({ isVerified }: VerifiedBadgeProps) {
    if (!isVerified) return null;

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Vérifié
        </span>
    );
}
