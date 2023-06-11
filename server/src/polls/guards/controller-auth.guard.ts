import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithAuth } from '../dto/dtos';

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request: RequestWithAuth = context.switchToHttp().getRequest();

    this.logger.debug(`Checking for auth token on request body`, request.body);

    const { accessToken } = request.body;

    try {
      const payload = this.jwtService.verify(accessToken);

      request.userID = payload.sub;
      request.pollID = payload.pollID;
      request.name = payload.name;
      return true;
    } catch {
      throw new ForbiddenException('Invalid authorization token');
    }
  }
}
