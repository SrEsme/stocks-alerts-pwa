const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const functionsRegion = 'us-central1';

export function functionUrl(name: string): string {
  if (!projectId) {
    throw new Error('VITE_FIREBASE_PROJECT_ID is not configured');
  }

  return `https://${functionsRegion}-${projectId}.cloudfunctions.net/${name}`;
}
