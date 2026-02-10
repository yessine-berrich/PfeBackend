// src/rag/ollama.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OllamaService {
  private readonly baseUrl = 'http://localhost:11434/api/generate'; // endpoint standard Ollama /generate
  private readonly model = 'llama3.1:8b'; // ← change ici si besoin

  /**
   * Génère une réponse RAG en appelant directement l'API Ollama
   */
  async generateRAGResponse(
    question: string,
    contextChunks: { title: string; content_preview: string; similarity: number }[],
  ): Promise<string> {
    const contextText = contextChunks
      .map((c, i) => `[Article ${i + 1}] (${c.title} – pertinence ${c.similarity.toFixed(3)})\n${c.content_preview}`)
      .join('\n────────────────────\n');

    const systemPrompt = `
Tu es un assistant technique expert en Linux, Node.js, DevOps et administration système.
Réponds toujours en français, de manière claire, structurée et professionnelle.
`;

    const userPrompt = `
Question de l'utilisateur : ${question}

Contexte extrait des articles de la base de connaissances :
${contextText}

Réponds maintenant en te basant sur le contexte fourni :
`;

    const fullPrompt = systemPrompt + '\n' + userPrompt;

    try {
      const response = await axios.post(this.baseUrl, {
        model: this.model,
        prompt: fullPrompt,
        stream: false,                // on veut la réponse complète d'un coup
        options: {
          temperature: 0.65,
          num_predict: 1800,          // ← limite de tokens (max générés)
          top_p: 0.9,
          top_k: 40,
        },
      });

      // La réponse Ollama /generate retourne { response: "le texte généré" }
      const generatedText = response.data.response || '';

      return generatedText.trim() || "Aucune réponse générée par Ollama.";
    } catch (err) {
      console.error('[OLLAMA] Erreur API :', err.response?.data || err.message);
      return "Désolé, une erreur est survenue avec Ollama. Vérifiez que le serveur est lancé et que le modèle est chargé.";
    }
  }
}