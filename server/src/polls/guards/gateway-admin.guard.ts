import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PollsService } from '../polls.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload, SocketWithAuth } from '../dto/dtos';
import { WsUnauthorizedException } from 'src/exceptions/ws-exception';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAdminGuard.name);
  constructor(
    private readonly pollsService: PollsService,
    private readonly jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: SocketWithAuth = context.switchToWs().getClient();

    const token =
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      this.logger.error('No authorization token provided');
      throw new WsUnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify<AuthPayload & { sub: string }>(
        token,
      );

      this.logger.debug(`Validating admin using token payload:`, payload);

      const { pollID, sub } = payload;

      const poll = await this.pollsService.getPoll(pollID);

      if (sub !== poll.adminID) {
        throw new WsUnauthorizedException('Admin priviliges required!');
      }

      return true;
    } catch {
      throw new WsUnauthorizedException('Admin priviliges required!');
    }
  }
}
