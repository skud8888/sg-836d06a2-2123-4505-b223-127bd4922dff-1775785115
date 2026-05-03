import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";

interface BreadcrumbProps {
  items?: { label: string; href?: string }[];
}

interface Crumb {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumb({ items }: BreadcrumbProps = {}) {
  const router = useRouter();

  const breadcrumbs = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, index) => ({
        label: item.label,
        href: item.href || "#",
        isLast: index === items.length - 1 || !item.href
      }));
    }

    const pathSegments = router.pathname.split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'Home', href: '/', isLast: pathSegments.length === 0 }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let label = segment;
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const paramName = segment.slice(1, -1);
        label = router.query[paramName] as string || segment;
      }
      
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
  }, [router.pathname, router.query, items]);

  if (router.pathname === '/' && (!items || items.length === 0)) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {index === 0 && (!items || items.length === 0) ? (
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