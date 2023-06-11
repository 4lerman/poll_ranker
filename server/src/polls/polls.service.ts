import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  AddNominationDto,
  AddParticipantDataDto,
  CreatePollDto,
  JoinPollDto,
  RejoinPollDto,
  SubmitRankingsDto,
} from './dto/dtos';
import {
  createNominationID,
  createPollID,
  createUserID,
} from 'src/helpers/ids';
import { PollsRepository } from './polls.repository';
import { JwtService } from '@nestjs/jwt';
import { Poll } from 'shared';
import getResults from 'src/polls/getResults';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);
  constructor(
    private readonly pollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createPoll(fields: CreatePollDto) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.pollsRepository.createPoll({
      ...fields,
      pollID,
      userID,
    });

    this.logger.debug(
      `Creating token string for pollID: ${createdPoll.id} and userID: ${userID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: createdPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      poll: createdPoll,
      accessToken: signedString,
    };
  }

  async joinPoll(fields: JoinPollDto) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(fields.pollID);

    this.logger.debug(
      `Creating token string for pollID: ${joinedPoll.id} and userID: ${userID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: joinedPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      poll: joinedPoll,
      accessToken: signedString,
    };
  }

  async rejoinPoll(fields: RejoinPollDto) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );

    const rejoinedPoll = await this.pollsRepository.addParticipant(fields);

    return rejoinedPoll;
  }

  async addParticipant(addParticipant: AddParticipantDataDto): Promise<Poll> {
    return this.pollsRepository.addParticipant(addParticipant);
  }

  async removeParticipant(
    pollID: string,
    userID: string,
  ): Promise<Poll | void> {
    const poll = await this.pollsRepository.getPoll(pollID);

    if (!poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant(
        pollID,
        userID,
      );

      return updatedPoll;
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    return this.pollsRepository.getPoll(pollID);
  }

  async addNomination({
    userID,
    pollID,
    text,
  }: AddNominationDto): Promise<Poll> {
    return this.pollsRepository.addNomination({
      pollID,
      nominationID: createNominationID(),
      nomination: {
        userID,
        text,
      },
    });
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    return this.pollsRepository.removeNomination(pollID, nominationID);
  }

  async startPoll(pollID: string): Promise<Poll> {
    return this.pollsRepository.startPoll(pollID);
  }

  async submitRankings(rankingsData: SubmitRankingsDto): Promise<Poll> {
    const hasPollStarted = this.pollsRepository.getPoll(rankingsData.pollID);

    if (!hasPollStarted)
      throw new BadRequestException(
        'Participants cannot rank until poll has started',
      );

    return this.pollsRepository.addParticipantRankings(rankingsData);
  }

  async calculateResults(pollID: string): Promise<Poll> {
    const poll = await this.pollsRepository.getPoll(pollID);

    const results = getResults(
      poll.rankings,
      poll.nominations,
      poll.votesPerVoter,
    );

    return this.pollsRepository.addResults(pollID, results);
  }

  async cancelPoll(pollID: string): Promise<void> {
    await this.pollsRepository.deletePoll(pollID);
  }
}
