import { Test, TestingModule } from '@nestjs/testing';
import { ManuscriptController } from './manuscript.controller';
import { ManuscriptService } from './manuscript.service';

describe('ManuscriptController', () => {
  let controller: ManuscriptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManuscriptController],
      providers: [ManuscriptService],
    }).compile();

    controller = module.get<ManuscriptController>(ManuscriptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
