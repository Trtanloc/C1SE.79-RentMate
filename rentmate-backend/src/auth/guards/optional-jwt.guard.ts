import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Allow anonymous access while attaching user info when a valid token is present
  handleRequest(err: unknown, user: any, info: unknown) {
    if (err || info) {
      return null;
    }
    return user || null;
  }
}
