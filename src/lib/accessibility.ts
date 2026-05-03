/**
 * Accessibility Audit Tool
 * 
 * Automated accessibility testing utilities
 */

export interface A11yIssue {
  type: 'error' | 'warning' | 'notice';
  rule: string;
  message: string;
  element: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface A11yAuditResult {
  passed: number;
  failed: number;
  warnings: number;
  issues: A11yIssue[];
  score: number;
}

/**
 * Run accessibility audit on current page
 */
export async function runA11yAudit(): Promise<A11yAuditResult> {
  const issues: A11yIssue[] = [];
  
  // Check for missing alt text on images
  document.querySelectorAll('img').forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: 'Image missing alt attribute',
        element: `img#${img.id || `image-${index}`}`,
        severity: 'critical'
      });
    }
  });

  // Check for form labels
  document.querySelectorAll('input, textarea, select').forEach((input, index) => {
    const id = input.getAttribute('id');
    if (id && !document.querySelector(`label[for="${id}"]`)) {
      issues.push({
        type: 'error',
        rule: 'label-required',
        message: 'Form control missing associated label',
        element: input.tagName.toLowerCase() + (id ? `#${id}` : `[${index}]`),
        severity: 'serious'
      });
    }
  });

  // Check for heading hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1));
    if (level - lastLevel > 1) {
      issues.push({
        type: 'warning',
        rule: 'heading-order',
        message: `Heading level skipped from h${lastLevel} to h${level}`,
        element: heading.tagName.toLowerCase(),
        severity: 'moderate'
      });
    }
    lastLevel = level;
  });

  // Check for color contrast (simplified check)
  document.querySelectorAll('button, a, input, textarea').forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    const bgColor = styles.backgroundColor;
    const textColor = styles.color;
    
    // Simple check - not comprehensive
    if (bgColor === textColor) {
      issues.push({
        type: 'error',
        rule: 'color-contrast',
        message: 'Insufficient color contrast',
        element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : `[${index}]`),
        severity: 'serious'
      });
    }
  });

  // Check for ARIA labels on interactive elements
  document.querySelectorAll('button, a[href]').forEach((element, index) => {
    const hasText = element.textContent?.trim();
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        type: 'error',
        rule: 'button-name',
        message: 'Interactive element has no accessible name',
        element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : `[${index}]`),
        severity: 'critical'
      });
    }
  });

  // Check for language attribute
  if (!document.documentElement.hasAttribute('lang')) {
    issues.push({
      type: 'error',
      rule: 'html-lang',
      message: 'HTML element missing lang attribute',
      element: 'html',
      severity: 'serious'
    });
  }

  // Check for skip links
  const skipLink = document.querySelector('a[href^="#main"], a[href^="#content"]');
  if (!skipLink) {
    issues.push({
      type: 'warning',
      rule: 'skip-link',
      message: 'No skip link found for keyboard navigation',
      element: 'body',
      severity: 'moderate'
    });
  }

  // Check for tab index abuse
  document.querySelectorAll('[tabindex]').forEach((element, index) => {
    const tabIndex = parseInt(element.getAttribute('tabindex') || '0');
    if (tabIndex > 0) {
      issues.push({
        type: 'warning',
        rule: 'tabindex',
        message: 'Positive tabindex values can cause keyboard navigation issues',
        element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : `[${index}]`),
        severity: 'moderate'
      });
    }
  });

  // Calculate results
  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;
  const total = errors + warnings;
  const score = total === 0 ? 100 : Math.max(0, 100 - (errors * 10 + warnings * 5));

  return {
    passed: total === 0 ? 1 : 0,
    failed: errors,
    warnings,
    issues,
    score
  };
}

/**
 * Format audit results as readable text
 */
export function formatA11yReport(result: A11yAuditResult): string {
  let report = `Accessibility Audit Results\n`;
  report += `============================\n\n`;
  report += `Score: ${result.score}/100\n`;
  report += `Errors: ${result.failed}\n`;
  report += `Warnings: ${result.warnings}\n\n`;

  if (result.issues.length === 0) {
    report += `✅ No accessibility issues found!\n`;
  } else {
    report += `Issues Found:\n\n`;
    
    // Group by severity
    const critical = result.issues.filter(i => i.severity === 'critical');
    const serious = result.issues.filter(i => i.severity === 'serious');
    const moderate = result.issues.filter(i => i.severity === 'moderate');
    const minor = result.issues.filter(i => i.severity === 'minor');

    if (critical.length > 0) {
      report += `🔴 CRITICAL (${critical.length}):\n`;
      critical.forEach(issue => {
        report += `   - ${issue.message} (${issue.element})\n`;
      });
      report += `\n`;
    }

    if (serious.length > 0) {
      report += `🟠 SERIOUS (${serious.length}):\n`;
      serious.forEach(issue => {
        report += `   - ${issue.message} (${issue.element})\n`;
      });
      report += `\n`;
    }

    if (moderate.length > 0) {
      report += `🟡 MODERATE (${moderate.length}):\n`;
      moderate.forEach(issue => {
        report += `   - ${issue.message} (${issue.element})\n`;
      });
      report += `\n`;
    }

    if (minor.length > 0) {
      report += `🔵 MINOR (${minor.length}):\n`;
      minor.forEach(issue => {
        report += `   - ${issue.message} (${issue.element})\n`;
      });
    }
  }

  return report;
}