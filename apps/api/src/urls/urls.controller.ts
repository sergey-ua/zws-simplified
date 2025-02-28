import {
	Body,
	Controller,
	Get,
	GoneException,
	HttpCode,
	HttpStatus,
	Inject,
	NotFoundException,
	Param,
	Post,
	Query,
	Res,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { OpenapiTag } from '../../../../../zws/apps/api/src/openapi/openapi-tag.enum';
import { LongUrlDto } from './dtos/long-url.dto';
import { Short } from './dtos/short.dto';
import { ShortenedUrlDto } from './dtos/shortened-url.dto';
import { VisitShortUrlQueryDto } from './dtos/visit-short-url-query.dto';
import { UrlsService } from './urls.service';

@Controller('/')
@ApiTags(OpenapiTag.ShortenedUrls)
export class UrlsController {
	constructor(
		@Inject(UrlsService) private readonly urlsService: UrlsService,
	) {}

	@Post('/')
	@HttpCode(HttpStatus.CREATED)
	@ApiCreatedResponse({ type: ShortenedUrlDto })
	async shortenUrl(@Body() body: LongUrlDto): Promise<ShortenedUrlDto> {
		const url = await this.urlsService.shortenUrl(body.url);

		return {
			short: url.short,
			url: url.url.toString(),
		};
	}

	@Get('/:short')
	@ApiOkResponse({ type: LongUrlDto })
	async visitShortUrl(
		@Param('short') rawShort: Short,
		@Query() query: VisitShortUrlQueryDto,
		@Res({ passthrough: true }) response: Response,
	): Promise<undefined | LongUrlDto> {
		const short = Short.parse(rawShort);

		const url = await this.urlsService.retrieveUrl(short);

		if (!url) {
			throw new NotFoundException("That shortened URL couldn't be found");
		}

		if (url.blocked) {
			throw new GoneException("That URL is blocked and can't be accessed");
		}

		if (query.visit !== false) {
			await this.urlsService.trackUrlVisit(short);

			response.redirect(308, url.longUrl.toString());
			return;
		}

		return {
			url: url.longUrl.toString(),
		};
	}
}
