import { Test, TestingModule } from '@nestjs/testing';
import { SemanticController } from './semantic.controller';
import { SemanticService } from './semantic.service';

describe('SemanticController', () => {
  let controller: SemanticController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemanticController],
      providers: [SemanticService],
    }).compile();

    controller = module.get<SemanticController>(SemanticController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
