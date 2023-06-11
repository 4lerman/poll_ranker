import { Length, IsInt, IsString, Min, Max, IsArray } from 'class-validator';
import { Request } from 'express';
import { Nomination } from 'shared';
import { Socket } from 'socket.io';

export class CreatePollDto {
  // service types/dtos

  @IsString()
  @Length(1, 100)
  topic: string;

  @IsInt()
  @Min(1)
  @Max(5)
  votesPerVoter: number;

  @IsString()
  @Length(1, 25)
  name: string;
}

export class JoinPollDto {
  @IsString()
  @Length(6, 6)
  pollID: string;

  @IsString()
  @Length(1, 25)
  name: string;
}

export class RejoinPollDto {
  @IsString()
  @Length(6, 6)
  pollID: string;

  @IsString()
  userID: string;

  @IsString()
  @Length(1, 25)
  name: string;
}

export class AddNominationDto {
  @IsString()
  pollID: string;

  @IsString()
  userID: string;

  @IsString()
  text: string;
}

export class NominationDto {
  @IsString()
  @Length(1, 100)
  text: string;
}

export class SubmitRankingsDto {
  @IsString()
  pollID: string;

  @IsString()
  userID: string;

  @IsArray()
  @IsString()
  rankings: string[];
}

// repository types/dtos

export class CreatePollDataDto {
  @IsString()
  pollID: string;

  @IsString()
  topic: string;

  @IsInt()
  votesPerVoter: number;

  @IsString()
  userID: string;
}

export class AddParticipantDataDto {
  @IsString()
  pollID: string;

  @IsString()
  userID: string;

  @IsString()
  name: string;
}

export class AddNominationDataDto {
  @IsString()
  pollID: string;

  @IsString()
  nominationID: string;

  nomination: Nomination;
}

export class AddParticipantRankingsData {
  @IsString()
  pollID: string;

  @IsString()
  userID: string;

  @IsArray()
  @IsString()
  rankings: string[];
}

// guard types
export type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};

export type RequestWithAuth = Request & AuthPayload;
export type SocketWithAuth = Socket & AuthPayload;
