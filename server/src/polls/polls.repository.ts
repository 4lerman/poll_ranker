import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from 'src/redis/redis.module';
import {
  AddNominationDataDto,
  AddParticipantDataDto,
  AddParticipantRankingsData,
  CreatePollDataDto,
} from './dto/dtos';
import { Poll, Results } from 'shared';

@Injectable()
export class PollsRepository {
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }

  async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollDataDto): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      nominations: {},
      rankings: {},
      results: [],
      adminID: userID,
      hasStarted: false,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls: ${pollID}`;

    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Trying to get poll with: ${pollID}`);

    const key = `polls: ${pollID}`;

    try {
      const currentPoll = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //     throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll);
    } catch (e) {
      this.logger.error(`Failed to get pollID ${pollID}`);
      throw new InternalServerErrorException(`Failed to get pollID ${pollID}`);
    }
  }

  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantDataDto): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID:${pollID}`,
    );

    const key = `polls: ${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
    }
  }

  async removeParticipant(pollID: string, userID: string): Promise<Poll> {
    this.logger.log(`removing userID: ${userID} from poll: ${pollID}`);

    const key = `polls: ${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participantPath);

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove userID: ${userID} from poll: ${pollID}`,
        e,
      );

      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationDataDto): Promise<Poll> {
    this.logger.log(
      `Attempting to add a nomination with nominationID/nomination: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
    );

    const key = `polls: ${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a nomination with nominationID/nomination: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to add a nomination with nominationID/nomination: ${nominationID}/${nomination.text} to pollID: ${pollID}`,
      );
    }
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    this.logger.log(
      `Removing nominationID: ${nominationID} from poll: ${pollID}`,
    );

    const key = `polls: ${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, nominationPath);

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
      );
    }
  }

  async startPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Setting hasStarted for Poll: ${pollID}`);

    const key = `polls: ${pollID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        '.hasStarted',
        JSON.stringify(true),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(`Failed to set hasStarted for poll: ${pollID}`);

      throw new InternalServerErrorException(
        'There was an error in starting the poll',
      );
    }
  }

  async addParticipantRankings({
    pollID,
    userID,
    rankings,
  }: AddParticipantRankingsData): Promise<Poll> {
    this.logger.log(
      `Attempting to add rankings for userID: ${userID} to pollID: ${pollID}`,
      rankings,
    );

    const key = `polls: ${pollID}`;
    const rankingsPath = `.rankings.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        rankingsPath,
        JSON.stringify(rankings),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add rankings for userID ${userID} to poll: ${pollID}`,
      );

      throw new InternalServerErrorException(
        'There was an error in starting the poll',
      );
    }
  }

  async addResults(pollID: string, results: Results): Promise<Poll> {
    this.logger.log(`Attempting to add a result to poll: ${pollID}`);

    const key = `polls: ${pollID}`;
    const resultsPath = '.results';

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        resultsPath,
        JSON.stringify(results),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add results for pollID: ${pollID}`,
        results,
        e,
      );

      throw new InternalServerErrorException(
        `Failed to add results for pollID: ${pollID}`,
      );
    }
  }

  async deletePoll(pollID: string): Promise<void> {
    const key = `polls: ${pollID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key);
    } catch (e) {
      this.logger.error(`Failed to delete poll: ${pollID}`, e);
      throw new InternalServerErrorException(
        `Failed to delete poll: ${pollID}`,
      );
    }
  }
}
