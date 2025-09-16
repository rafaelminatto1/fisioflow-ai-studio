import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const knowledgeBase = new Hono<{ Bindings: Env }>();

// Validation schemas
const CreateArticleSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  contentText: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.enum(['PDF', 'VIDEO', 'LINK', 'DOCUMENT']).default('PDF'),
  tags: z.string().optional(),
  category: z.enum([
    'ORTOPEDIA', 'NEUROLOGIA', 'CARDIO', 'RESPIRATORIA', 'PEDIATRICA', 
    'GERIATRICA', 'DERMATOFUNCIONAL', 'ESPORTIVA', 'GESTAO', 'PROTOCOLOS', 
    'ANATOMIA', 'FISIOLOGIA', 'FARMACOLOGIA', 'OUTROS'
  ]).default('OUTROS')
});

const SearchSchema = z.object({
  query: z.string().min(1, "Consulta é obrigatória"),
  category: z.string().optional(),
  tags: z.string().optional()
});

// Helper function to search articles by text similarity
function calculateRelevanceScore(searchTerms: string[], text: string): number {
  const lowerText = text.toLowerCase();
  const lowerTerms = searchTerms.map(term => term.toLowerCase());
  
  let score = 0;
  for (const term of lowerTerms) {
    const occurrences = (lowerText.match(new RegExp(term, 'g')) || []).length;
    score += occurrences;
  }
  
  return score;
}

// GET /api/knowledge - List all knowledge articles
knowledgeBase.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const { category, search, tags } = c.req.query();
    
    let query = `
      SELECT 
        k.*,
        u.name as author_name
      FROM knowledge_articles k
      LEFT JOIN users u ON k.user_id = u.id
      WHERE k.clinic_id = ? AND k.is_active = 1
    `;
    
    const params: any[] = [user.clinicId];
    
    if (category && category !== 'ALL') {
      query += ` AND k.category = ?`;
      params.push(category);
    }
    
    if (search) {
      query += ` AND (k.title LIKE ? OR k.description LIKE ? OR k.content_text LIKE ? OR k.tags LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (tags) {
      query += ` AND k.tags LIKE ?`;
      params.push(`%${tags}%`);
    }
    
    query += ` ORDER BY k.created_at DESC`;
    
    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching knowledge articles:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar artigos'
    }, 500);
  }
});

// GET /api/knowledge/categories - Get article count by category
knowledgeBase.get("/categories", async (c) => {
  try {
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM knowledge_articles
      WHERE clinic_id = ? AND is_active = 1
      GROUP BY category
      ORDER BY count DESC
    `).bind(user.clinicId).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar categorias'
    }, 500);
  }
});

// GET /api/knowledge/:id - Get specific article
knowledgeBase.get("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    // Increment view count
    await db.prepare(`
      UPDATE knowledge_articles SET 
        view_count = view_count + 1,
        updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(id, user.clinicId).run();

    const result = await db.prepare(`
      SELECT 
        k.*,
        u.name as author_name
      FROM knowledge_articles k
      LEFT JOIN users u ON k.user_id = u.id
      WHERE k.id = ? AND k.clinic_id = ? AND k.is_active = 1
    `).bind(id, user.clinicId).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Artigo não encontrado'
      }, 404);
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar artigo'
    }, 500);
  }
});

// POST /api/knowledge - Create new article
knowledgeBase.post("/", zValidator('json', CreateArticleSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      INSERT INTO knowledge_articles (
        clinic_id, user_id, title, description, content_text,
        file_url, file_type, tags, category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      user.clinicId,
      user.id,
      data.title,
      data.description || null,
      data.contentText || null,
      data.fileUrl || null,
      data.fileType,
      data.tags || null,
      data.category
    ).run();

    if (!result.success) {
      throw new Error('Falha ao criar artigo');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({
      success: false,
      error: 'Falha ao criar artigo'
    }, 500);
  }
});

// PUT /api/knowledge/:id - Update article
knowledgeBase.put("/:id", zValidator('json', CreateArticleSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    // Check if user owns the article or is admin
    const article = await db.prepare(`
      SELECT user_id FROM knowledge_articles 
      WHERE id = ? AND clinic_id = ?
    `).bind(id, user.clinicId).first();

    if (!article) {
      return c.json({
        success: false,
        error: 'Artigo não encontrado'
      }, 404);
    }

    if (article.user_id !== user.id && user.role !== 'ADMIN') {
      return c.json({
        success: false,
        error: 'Sem permissão para editar este artigo'
      }, 403);
    }

    const result = await db.prepare(`
      UPDATE knowledge_articles SET
        title = ?, description = ?, content_text = ?, file_url = ?,
        file_type = ?, tags = ?, category = ?, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(
      data.title,
      data.description || null,
      data.contentText || null,
      data.fileUrl || null,
      data.fileType,
      data.tags || null,
      data.category,
      id,
      user.clinicId
    ).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar artigo');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar artigo'
    }, 500);
  }
});

// POST /api/knowledge/search-ai - AI-powered search
knowledgeBase.post("/search-ai", zValidator('json', SearchSchema), async (c) => {
  try {
    const { query, category, tags } = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    // Search terms extraction
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    // Search in knowledge base
    let searchQuery = `
      SELECT 
        k.*,
        u.name as author_name
      FROM knowledge_articles k
      LEFT JOIN users u ON k.user_id = u.id
      WHERE k.clinic_id = ? AND k.is_active = 1
    `;
    
    const params: any[] = [user.clinicId];
    
    if (category && category !== 'ALL') {
      searchQuery += ` AND k.category = ?`;
      params.push(category);
    }
    
    if (tags) {
      searchQuery += ` AND k.tags LIKE ?`;
      params.push(`%${tags}%`);
    }
    
    const articles = await db.prepare(searchQuery).bind(...params).all();
    const results = articles.results || [];
    
    // Calculate relevance scores
    const relevantArticles = results
      .map((article: any) => {
        const titleScore = calculateRelevanceScore(searchTerms, article.title || '');
        const descScore = calculateRelevanceScore(searchTerms, article.description || '');
        const contentScore = calculateRelevanceScore(searchTerms, article.content_text || '');
        const tagsScore = calculateRelevanceScore(searchTerms, article.tags || '');
        
        const totalScore = titleScore * 3 + descScore * 2 + contentScore + tagsScore * 2;
        
        return {
          ...article,
          relevance_score: totalScore
        };
      })
      .filter((article: any) => article.relevance_score > 0)
      .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
      .slice(0, 10);

    // Log the search
    await db.prepare(`
      INSERT INTO ai_search_logs (
        clinic_id, user_id, search_query, search_results, 
        external_ai_suggested, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.clinicId,
      user.id,
      query,
      JSON.stringify(relevantArticles.slice(0, 5)),
      relevantArticles.length === 0 ? 1 : 0
    ).run();

    let response: any = {
      success: true,
      data: {
        found_articles: relevantArticles,
        search_query: query,
        total_results: relevantArticles.length
      }
    };

    // If no relevant articles found, suggest external AI
    if (relevantArticles.length === 0) {
      response.data.ai_suggestion = {
        message: "Não encontrei essa informação na sua base de conhecimento.",
        external_suggestions: [
          {
            name: "Google Gemini",
            url: "https://gemini.google.com",
            description: "IA gratuita do Google para pesquisas gerais"
          },
          {
            name: "ChatGPT",
            url: "https://chat.openai.com",
            description: "IA conversacional para consultas detalhadas"
          },
          {
            name: "Perplexity",
            url: "https://perplexity.ai",
            description: "IA com fontes acadêmicas e científicas"
          }
        ],
        suggested_search: `"${query}" fisioterapia evidence based`
      };
    }

    return c.json(response);
  } catch (error) {
    console.error('Error in AI search:', error);
    return c.json({
      success: false,
      error: 'Falha na pesquisa inteligente'
    }, 500);
  }
});

// GET /api/knowledge/search-history - Get user's search history
knowledgeBase.get("/search-history", async (c) => {
  try {
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      SELECT 
        search_query,
        external_ai_suggested,
        created_at
      FROM ai_search_logs
      WHERE clinic_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(user.clinicId, user.id).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching search history:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar histórico'
    }, 500);
  }
});

// DELETE /api/knowledge/:id - Soft delete article
knowledgeBase.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    // Check if user owns the article or is admin
    const article = await db.prepare(`
      SELECT user_id FROM knowledge_articles 
      WHERE id = ? AND clinic_id = ?
    `).bind(id, user.clinicId).first();

    if (!article) {
      return c.json({
        success: false,
        error: 'Artigo não encontrado'
      }, 404);
    }

    if (article.user_id !== user.id && user.role !== 'ADMIN') {
      return c.json({
        success: false,
        error: 'Sem permissão para excluir este artigo'
      }, 403);
    }

    const result = await db.prepare(`
      UPDATE knowledge_articles SET is_active = 0, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(id, user.clinicId).run();

    if (!result.success) {
      throw new Error('Falha ao excluir artigo');
    }

    return c.json({
      success: true,
      message: 'Artigo excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({
      success: false,
      error: 'Falha ao excluir artigo'
    }, 500);
  }
});

export { knowledgeBase };
