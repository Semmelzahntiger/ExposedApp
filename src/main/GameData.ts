export type EmbedPlatform = "instagram" | "tiktok";

// A single social embed to display during a round.
// `url` is the public permalink of the reel / post / tiktok.
export type GameEmbed = {
    platform: EmbedPlatform;
    url: string;
};

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
