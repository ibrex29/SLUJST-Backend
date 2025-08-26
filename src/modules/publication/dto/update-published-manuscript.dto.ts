import { PartialType } from "@nestjs/swagger";
import { PublishManuscriptDto } from "./publish-manuscript.dto";

export class UpdatePublicationDto extends PartialType(PublishManuscriptDto) {}