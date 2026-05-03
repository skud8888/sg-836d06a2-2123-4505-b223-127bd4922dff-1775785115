import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";

export function Breadcrumb() {
  const router = useRouter();

  const breadcrumbs = useMemo(() => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Replace dynamic segments with actual values from query
      let label = segment;
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const paramName = segment.slice(1, -1);
        label = router.query[paramName] as string || segment;
      }
      
      // Format label: remove hyphens, capitalize
      label = label
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      crumbs.push({
        label,
        href: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });

    return crumbs;
  }, [router.pathname, router.query]);

  // Don't show breadcrumbs on homepage
  if (router.pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {index === 0 ? (
            <Link 
              href={crumb.href}
              className="flex items-center hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
            </Link>
          ) : crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link 
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}