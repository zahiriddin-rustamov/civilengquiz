interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  viewCount: number;
  tags: string[];
}

interface YouTubeAPIResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      channelTitle: string;
      thumbnails: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
        default: { url: string };
      };
      tags?: string[];
    };
    contentDetails: {
      duration: string; // ISO 8601 format like "PT4M13S"
    };
    statistics: {
      viewCount: string;
    };
  }>;
}

/**
 * Convert ISO 8601 duration (PT4M13S) to seconds
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Fetch video metadata from YouTube Data API v3
 */
export async function fetchYouTubeVideoData(videoId: string): Promise<YouTubeVideoData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not found in environment variables');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('YouTube API request failed:', response.status, response.statusText);
      return null;
    }

    const data: YouTubeAPIResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.error('Video not found or private');
      return null;
    }

    const video = data.items[0];
    const duration = parseDuration(video.contentDetails.duration);

    // Get best quality thumbnail
    const thumbnails = video.snippet.thumbnails;
    const thumbnail = thumbnails.maxres?.url ||
                     thumbnails.high?.url ||
                     thumbnails.medium?.url ||
                     thumbnails.default.url;

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      duration,
      thumbnail,
      publishedAt: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle,
      viewCount: parseInt(video.statistics.viewCount || '0', 10),
      tags: video.snippet.tags || []
    };

  } catch (error) {
    console.error('Error fetching YouTube video data:', error);
    return null;
  }
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Estimate reading/learning time based on video duration
 */
export function estimateLearningTime(durationSeconds: number): number {
  // For videos under 2 minutes, learning time = video duration
  if (durationSeconds < 120) {
    return Math.ceil(durationSeconds / 60);
  }

  // For longer videos, add 20% buffer time for pausing, note-taking, etc.
  const bufferMultiplier = 1.2;
  return Math.ceil((durationSeconds * bufferMultiplier) / 60);
}