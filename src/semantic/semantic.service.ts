import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../article/entities/article.entity';
import ollama from 'ollama';

@Injectable()
export class SemanticService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async searchArticles(query: string) {
  const queryVector = await this.getVector(query);
  console.log("Vecteur de recherche généré :", queryVector.slice(0, 3), "...");

  const rawResults = await this.articleRepository.manager.query(
    `SELECT id, title, status, (embedding <=> $1::vector) as distance 
     FROM articles 
     ORDER BY distance ASC LIMIT 5`,
    [JSON.stringify(queryVector)]
  );

  console.log("Résultats bruts SQL :", rawResults);
  return rawResults;
}

  // Utilitaire pour obtenir un vecteur (réutilisable)
  async getVector(text: string): Promise<number[]> {
    const response = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: text,
    });
    return response.embedding;
  }

  // semantic.service.ts
async onModuleInit() {
  try {
    await ollama.show({ model: 'nomic-embed-text' });
    console.log('✅ Modèle Ollama nomic-embed-text prêt !');
  } catch (e) {
    console.error('❌ ATTENTION: Le modèle nomic-embed-text n est pas installé sur Ollama.');
    console.error('Lancez la commande: ollama pull nomic-embed-text');
  }
}
}