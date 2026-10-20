"use server";

// @ts-ignore
import youtubesearchapi from "youtube-search-api";
import { YouTubeSearchResponse } from "@/app/Actions/types/yotube";

export default async function searchYouTube(query: string) {
  try {
    if (!query) return { items: [], nextPage: null };

    // 1. Request a larger pool (e.g., 40) so filtering doesn't leave you with too few results
    const response = await youtubesearchapi.GetListByKeyword(query, false, 40);

    if (response && Array.isArray(response.items)) {
      // 2. Filter out non-video items
      const onlyVideos = response.items.filter(
        (item: any) => item.type === "video",
      );

      // 3. Take up to 10 (or 20) videos from the clean video list

      return {
        ...response,
        items: onlyVideos,
      };
    }

    return response;
  } catch (error) {
    console.error("YouTube search error: ", error);
    return { items: [], nextPage: null };
  }
}

export async function NextpagesearchYouTube(token: any) {
  try {
    const response = await youtubesearchapi.NextPage(token.nextPage, false, 40);
    if (response && Array.isArray(response.items)) {
      // 2. Filter out non-video items
      const onlyVideos = response.items.filter(
        (item: any) => item.type === "video",
      );

      // 3. Take up to 10 (or 20) videos from the clean video list

      return {
        ...response,
        items: onlyVideos,
      };
    }
  } catch (error) {
    console.error("YouTube search error: ", error);
    return { items: [], nextPage: null };
  }
}
