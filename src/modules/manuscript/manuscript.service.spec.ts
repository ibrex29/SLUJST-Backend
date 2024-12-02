import { Test, TestingModule } from '@nestjs/testing';
import { ManuscriptService } from './manuscript.service';

describe('ManuscriptService', () => {
  let service: ManuscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManuscriptService],
    }).compile();

    service = module.get<ManuscriptService>(ManuscriptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
