export class MapsService {
  /**
   * Get all available offline map regions
   * In a real app, this might query an AWS S3 bucket or Supabase Storage
   */
  static async getAvailableMaps() {
    return [
      {
        id: 'map_delhi_mumbai_01',
        regionName: 'Delhi-Mumbai Corridor (NH-48)',
        fileSizeMb: 450.5,
        version: '2026.04',
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        downloadUrl: 'https://cdn.routecopilot.ai/maps/delhi-mumbai-v2026.04.zip',
        isCritical: true
      },
      {
        id: 'map_pune_bengaluru_02',
        regionName: 'Pune-Bengaluru Expressway',
        fileSizeMb: 320.0,
        version: '2026.02',
        lastUpdated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        downloadUrl: 'https://cdn.routecopilot.ai/maps/pune-bengaluru-v2026.02.zip',
        isCritical: false
      },
      {
        id: 'map_north_himalayas_03',
        regionName: 'Himalayan Transport Routes',
        fileSizeMb: 150.2,
        version: '2026.03',
        lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        downloadUrl: 'https://cdn.routecopilot.ai/maps/himalayas-v2026.03.zip',
        isCritical: false // Often goes offline, highly recommended
      }
    ];
  }

  /**
   * Track that a driver has downloaded a specific map
   * This is useful for pushing updates to them later
   */
  static async logMapDownload(userId: string, mapId: string) {
    // In production, we'd save this to a `user_downloaded_maps` table in Supabase.
    // For now, we simulate success so the frontend knows it can start the download.
    return {
      userId,
      mapId,
      status: 'Download Authorized',
      downloadExpiresIn: '1 hour'
    };
  }
}
