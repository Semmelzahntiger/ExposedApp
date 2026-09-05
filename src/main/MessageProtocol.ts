export type MessageType =
    // Incoming
    | "send_authentication"
    | "create_room"
    | "join_room"
    | "leave_room"
    | "change_room_settings"
    | "start_game"
    | "submit_guess"
    | "submit_multi_guess" //Unused currently
    | "change_lobby_admin"
    | "skip_round"
    // Outgoing
    | "confirm_authentication"
    | "denied_authentication"
    | "confirm_create_room"
    | "denied_create_room"
    | "confirm_join_room"
    | "denied_join_room"
    | "room_not_found"
    | "confirm_leave_room"
    | "confirm_change_room_settings"
    | "denied_change_room_settings"
    | "started_game"
    | "denied_start_game"
    | "update_room_state"
    | "next_round"
    | "confirm_submission"
    | "denied_submission"
    | "game_score_state"
    | "game_over"
    | "multi_guess_result";

export type Message<T extends MessageType> = {
    type: T;
}

// Backend serializes UUID and LocalDate as strings (LocalDate as ISO "yyyy-MM-dd").
type UUID = string;
type LocalDate = string;

// ---- Shared / nested payloads (no `type` field, they're plain objects) ----
export type Participant = {
    uuid: UUID;
    username: string;
}
export type RoomPlayerRole = {
    playerUUID: UUID;
    username: string;
    isHost: boolean;
}
export type RoomSettingsState = {
    roomSize: number;
    rounds: number;
    roundTimeInSeconds: number;
    enabledPlatforms: string[];
    enabledResources: string[];
    beforeDate: LocalDate;
}
export type ScorePlayer = {
    playerUUID: UUID;
    username: string;
    score: number;
    earnedThisRound: number;
}
export type UserScore = {
    user: UUID;
    username: string;
    score: number;
}
export type MediaItem = InstagramMediaType | TikTokSlideshowItem | TikTokVideoItem | StringMediaItem |  MissingMediaItem;
export type DistinctionType = "instagram_mixed_media" | "tiktok_slide_show_media" | "tiktok_video_media" | "string_media_item" | "missing_media"
export type MediaType = "MIXED" | "IMAGE" | "VIDEO" | "TEXT" | "NONE";
export type SocialMediaPlatform = "instagram" | "tiktok";

export type AbstractMediaType<D extends DistinctionType, T extends MediaType> = {
    platform : SocialMediaPlatform;
    type: T;
    distinctionType: D;
}
export type InstagramMediaType = AbstractMediaType<"instagram_mixed_media", "MIXED"> & {
    entries: InstagramCDNEntry[];
}
export type InstagramCDNEntry = {
    type: string;
    url: string;
}
export type TikTokSlideshowItem = AbstractMediaType<"tiktok_slide_show_media", "IMAGE"> & {
    imageUrls: string[];
    audioUrl: string;
}
// The video is not sent as a direct CDN URL — it is streamed through the backend
// proxy (see tiktokStreamUrl in config/endpoints.ts), keyed by these two fields.
export type TikTokVideoItem = AbstractMediaType<"tiktok_video_media", "VIDEO"> & {
    postId: string;
    roomId: string;
}
export type StringMediaItem = AbstractMediaType<"string_media_item", "TEXT"> & {
    stringMedia: string;
}
export type MissingMediaItem = AbstractMediaType<"missing_media", "NONE">;

// ---- Direction unions (frontend's perspective) ----
export type OutboundMessages =
    | AuthenticationMessage
    | CreateRoomMessage
    | JoinRoomMessage
    | LeaveRoomMessage
    | ChangeRoomSettings
    | StartGameMessage
    | SubmitGuessMessage
    | SubmitMultiGuessMessage
    | ChangeLobbyAdminMessage
    | SkipRoundMessage;

export type InboundMessages =
    | ConfirmAuthenticationMessage
    | DenyAuthenticationMessage
    | ConfirmCreateRoomMessage
    | DenyCreateRoomMessage
    | ConfirmJoinRoomMessage
    | DenyJoinRoomMessage
    | RoomNotFoundMessage
    | ConfirmLeaveRoomMessage
    | ConfirmChangeRoomSettings
    | DenyChangeRoomMessage
    | StartedGameMessage
    | DenyStartGame
    | UpdateRoomStateMessage
    | NextRoundMessage
    | ConfirmSubmissionMessage
    | DenySubmissionMessage
    | UpdateGameScoreStateMessage
    | GameOverMessage
    | MultiGuessResultMessage;

// ---- Outbound (frontend → server) ----
export type AuthenticationMessage = Message<"send_authentication"> & {
    token: string;
}
export type CreateRoomMessage = Message<"create_room"> & {}
export type JoinRoomMessage = Message<"join_room"> & {
    code: string;
}
export type LeaveRoomMessage = Message<"leave_room"> & {}
export type ChangeRoomSettings = Message<"change_room_settings"> & {
    roomSize: number;
    rounds: number;
    roundTimeInSeconds: number;
    enabledPlatforms: string[];
    enabledResources: string[];
    beforeDate: LocalDate;
}
export type StartGameMessage = Message<"start_game"> & {}
export type SubmitGuessMessage = Message<"submit_guess"> & {
    guessedUUID: UUID;
}
export type SubmitMultiGuessMessage = Message<"submit_multi_guess"> & {}
export type ChangeLobbyAdminMessage = Message<"change_lobby_admin"> & {
    newAdminUUID: UUID;
}
export type SkipRoundMessage = Message<"skip_round"> & {}

// ---- Inbound (server → frontend) ----
export type ConfirmAuthenticationMessage = Message<"confirm_authentication"> & {}
export type DenyAuthenticationMessage = Message<"denied_authentication"> & {}
export type ConfirmCreateRoomMessage = Message<"confirm_create_room"> & {}
export type DenyCreateRoomMessage = Message<"denied_create_room"> & {
    reason: string;
}
export type ConfirmJoinRoomMessage = Message<"confirm_join_room"> & {}
export type DenyJoinRoomMessage = Message<"denied_join_room"> & {
    error: string;
}
export type RoomNotFoundMessage = Message<"room_not_found"> & {}
export type ConfirmLeaveRoomMessage = Message<"confirm_leave_room"> & {}
export type ConfirmChangeRoomSettings = Message<"confirm_change_room_settings"> & {}
export type DenyChangeRoomMessage = Message<"denied_change_room_settings"> & {
    error: string;
}
export type StartedGameMessage = Message<"started_game"> & {
    participants: Participant[];
}
export type DenyStartGame = Message<"denied_start_game"> & {
    reason: string;
}
export type UpdateRoomStateMessage = Message<"update_room_state"> & {
    roomCode: string;
    players: RoomPlayerRole[];
    hostIsReceiver: boolean;
    settings: RoomSettingsState;
}
// One resolved media item: a direct CDN URL plus what it is ("video" | "image").
export type NextRoundResource = {
    mediaType: string;
    url: string;
}
export type NextRoundMessage = Message<"next_round"> & {
    mediaItem: MediaItem;
    roundTimeInSeconds: number;
}
export type ConfirmSubmissionMessage = Message<"confirm_submission"> & {}
export type DenySubmissionMessage = Message<"denied_submission"> & {
    error: string;
}
export type UpdateGameScoreStateMessage = Message<"game_score_state"> & {
    ownUUID: UUID;
    players: ScorePlayer[];
}
export type GameOverMessage = Message<"game_over"> & {
    isWinner: boolean;
    ownUUID: UUID;
    username : string;
    scores: UserScore[];
}
export type MultiGuessResultMessage = Message<"multi_guess_result"> & {}
