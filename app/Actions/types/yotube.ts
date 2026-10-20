// types/youtube.ts
export interface YouTubeVideoItem {
  id: string;
  type: 'video';
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  }[];
  channelTitle: string;
  shortBylineText: string;
  length: {
    accessibility: { accessibilityData: { label: string } };
    simpleText: string;
  };
  isLive: boolean;
}

export interface YouTubeSearchResponse {
  items: YouTubeVideoItem[];
  nextPage: any;
}
