export function communityProjectPath(projectId: string) {
  return `/projects/community/${projectId}`;
}

export function communityProjectUrl(projectId: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${communityProjectPath(projectId)}`;
  }
  return communityProjectPath(projectId);
}

export function twitterShareUrl(url: string, text: string) {
  const params = new URLSearchParams({
    text,
    url,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function linkedInShareUrl(url: string) {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

export function shareMessage(projectName: string, tech: string[]) {
  const stack = tech.slice(0, 3).join(", ");
  return stack
    ? `Check out ${projectName} on NovaStudio Community — built with ${stack}`
    : `Check out ${projectName} on NovaStudio Community`;
}
