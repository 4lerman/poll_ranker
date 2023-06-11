import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { SocketWithAuth } from 'src/polls/dto/dtos';
import {
  WsBadRequestException,
  WsTypeException,
  WsUnknownException,
} from './ws-exception';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (exception instanceof BadRequestException) {
      const exceptionData = exception.getResponse();

      const wsException = new WsBadRequestException(
        exceptionData['message'] ?? exceptionData ?? 'BadRequest',
      );
      socket.emit('exception', wsException.getError());
      return;
    }

    if (exception instanceof WsTypeException) {
      socket.emit('exception', exception.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit('exception', wsException.getError());
  }
}
