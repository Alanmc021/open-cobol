import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { Public } from './decorators/public.decorator.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'

class LoginDto {
  email!: string
  password!: string
}

class RefreshDto {
  refreshToken!: string
}

class CreateApiKeyDto {
  name!: string
}

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Get('me')
  me(@Request() req: { user: { id: string; email: string; role: string } }) {
    return req.user
  }

  @Post('api-keys')
  createApiKey(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.auth.createApiKey(req.user.id, dto.name)
  }

  @Get('api-keys')
  listApiKeys(@Request() req: { user: { id: string } }) {
    return this.auth.listApiKeys(req.user.id)
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteApiKey(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.auth.deleteApiKey(id, req.user.id)
  }
}
