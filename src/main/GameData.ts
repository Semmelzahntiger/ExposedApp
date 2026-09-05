export type EmbedPlatform =
    "instagram" |
    "tiktok";

export type RoomSettings = {
    roomSize: number;
    rounds: number;
    platforms: {
        tiktok: boolean;
        instagram: boolean;
    };
    sources: {
        liked: boolean;
        saved: boolean;
        reposted: boolean;
        commented: boolean;
        searched: boolean;
    };
};
