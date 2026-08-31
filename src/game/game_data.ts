import {Participant} from "@/main/MessageProtocol";


let participants: Participant[];

export function setParticipants(newParticipants: Participant[]) {
    participants = newParticipants;
}