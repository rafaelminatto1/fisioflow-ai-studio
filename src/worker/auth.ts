import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from 'resend';

const auth = new Hono<{ Bindings: Env }>();

// Schemas de validação
const RegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(['ADMIN', 'FISIOTERAPEUTA', 'PACIENTE']).default('PACIENTE'),
  phone: z.string().optional(),
  clinicId: z.number().optional()
});

const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Email inválido")
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres")
});

// Função auxiliar para gerar JWT
function generateJWT(user: any, secret: string): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clinicId: user.clinic_id,
    isEmailVerified: user.is_email_verified
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d', // Token válido por 7 dias
    issuer: 'fisioflow-app'
  });
}

// Função auxiliar para gerar token de reset
function generateResetToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Função auxiliar para hash da senha
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

// Função auxiliar para enviar email de reset de senha
async function sendPasswordResetEmail(email: string, resetToken: string, resendApiKey: string): Promise<boolean> {
  try {
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured. Reset link would be: https://activity.mocha.app/reset-password?token=' + resetToken);
      return true; // Return true for development
    }

    const resend = new Resend(resendApiKey);
    
    const resetLink = `https://activity.mocha.app/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha - FisioFlow</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #334155;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .footer {
              background: #f1f5f9;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #64748b;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 16px;
              border-radius: 8px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 FisioFlow</h1>
            </div>
            <div class="content">
              <h2>Redefinir sua senha</h2>
              <p>Olá!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no FisioFlow. Se você fez essa solicitação, clique no botão abaixo para criar uma nova senha:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Redefinir Senha</a>
              </div>
              
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="background: #f1f5f9; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 14px;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este link é válido por apenas 1 hora por motivos de segurança.
              </div>
              
              <p>Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. Sua conta permanecerá segura.</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe FisioFlow</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda.</p>
              <p>© ${new Date().getFullYear()} FisioFlow - Sistema de Gestão para Fisioterapeutas</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'FisioFlow <noreply@fisioflow.com>',
      to: [email],
      subject: 'Redefinir sua senha - FisioFlow',
      html: emailHtml,
    });

    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // In development, log the reset link even if email fails
    console.log('Reset link (email failed): https://activity.mocha.app/reset-password?token=' + resetToken);
    return false;
  }
}

// Função auxiliar para verificar senha
async function verifyPassword(password: string, hash: any): Promise<boolean> {
  // Garantir que os argumentos são strings válidas
  if (!password || typeof password !== 'string') {
    console.error('Invalid password argument:', { 
      password: typeof password, 
      passwordValue: password 
    });
    return false;
  }

  // Verificar se o hash é válido
  if (!hash || typeof hash !== 'string' || hash === 'null') {
    console.error('Invalid hash argument:', { 
      hash: typeof hash, 
      hashValue: hash,
      hashLength: typeof hash === 'string' ? hash.length : 0
    });
    return false;
  }
  
  if (hash.length < 10) {
    console.error('Hash too short:', { 
      hashLength: hash.length,
      hash: hash
    });
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// POST /api/auth/register - Registrar novo usuário
auth.post("/register", zValidator('json', RegisterSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;

    // Verificar se o email já existe
    const existingUser = await db.prepare(`
      SELECT id FROM users WHERE email = ? AND is_active = 1
    `).bind(data.email).first();

    if (existingUser) {
      return c.json({
        success: false,
        error: 'Este email já está cadastrado'
      }, 409);
    }

    // Gerar hash da senha
    const { hash, salt } = await hashPassword(data.password);

    // Definir clinic_id padrão se não fornecido
    const clinicId = data.clinicId || 1;

    // Inserir novo usuário
    const result = await db.prepare(`
      INSERT INTO users (
        name, email, password_hash, salt, role, phone, clinic_id,
        is_email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      data.name,
      data.email,
      hash,
      salt,
      data.role,
      data.phone || null,
      clinicId
    ).run();

    if (!result.success) {
      throw new Error('Falha ao criar usuário');
    }

    return c.json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      data: {
        id: result.meta.last_row_id,
        name: data.name,
        email: data.email,
        role: data.role
      }
    }, 201);

  } catch (error) {
    console.error('Erro no registro:', error);
    return c.json({
      success: false,
      error: 'Erro interno do servidor'
    }, 500);
  }
});

// POST /api/auth/login - Fazer login
auth.post("/login", zValidator('json', LoginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const db = c.env.DB;

    // Buscar usuário pelo email
    const user = await db.prepare(`
      SELECT 
        id, name, email, password_hash, salt, role, clinic_id, 
        phone, avatar, specialties, is_email_verified, is_active
      FROM users 
      WHERE email = ? AND is_active = 1
    `).bind(email).first();

    if (!user) {
      return c.json({
        success: false,
        error: 'Credenciais inválidas'
      }, 401);
    }

    // Verificar senha - garantir que password_hash existe e é uma string
    const passwordHash = user.password_hash;
    if (!passwordHash || typeof passwordHash !== 'string' || passwordHash === 'null') {
      console.error('Invalid password hash from database:', { 
        userId: user.id, 
        email: user.email,
        hashType: typeof passwordHash,
        hash: passwordHash,
        hashLength: typeof passwordHash === 'string' ? passwordHash.length : 0
      });
      return c.json({
        success: false,
        error: 'Usuário não tem senha válida configurada. Entre em contato com o administrador.'
      }, 401);
    }

    if (passwordHash.length < 10) {
      console.error('Password hash too short:', { 
        userId: user.id,
        hashLength: passwordHash.length
      });
      return c.json({
        success: false,
        error: 'Usuário não tem senha válida configurada. Entre em contato com o administrador.'
      }, 401);
    }

    const isValidPassword = await verifyPassword(password, passwordHash);
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: 'Credenciais inválidas'
      }, 401);
    }

    // Atualizar último login
    await db.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();

    // Gerar JWT
    const env = c.env as any;
    const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    const token = generateJWT(user, JWT_SECRET);

    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinic_id,
          phone: user.phone,
          avatar: user.avatar,
          specialties: user.specialties,
          isEmailVerified: user.is_email_verified
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return c.json({
      success: false,
      error: 'Erro interno do servidor'
    }, 500);
  }
});

// POST /api/auth/forgot-password - Solicitar reset de senha
auth.post("/forgot-password", zValidator('json', ForgotPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');
    const db = c.env.DB;

    // Buscar usuário (não retornar se existe para segurança)
    const user = await db.prepare(`
      SELECT id FROM users WHERE email = ? AND is_active = 1
    `).bind(email).first();

    if (user) {
      // Gerar token único
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Limpar tokens antigos do usuário
      await db.prepare(`
        DELETE FROM password_reset_tokens WHERE user_id = ?
      `).bind(user.id).run();

      // Inserir novo token
      await db.prepare(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).bind(user.id as number, token, expiresAt.toISOString()).run();

      // Enviar email de reset de senha
      const resendApiKey = c.env.RESEND_API_KEY;
      const emailSent = await sendPasswordResetEmail(email, token, resendApiKey);
      
      if (!emailSent) {
        console.log(`Fallback - Reset token for ${email}: ${token}`);
      }
    }

    // Sempre retornar sucesso para não vazar informações
    return c.json({
      success: true,
      message: 'Se o email existir, um link de redefinição será enviado'
    });

  } catch (error) {
    console.error('Erro no forgot password:', error);
    return c.json({
      success: false,
      error: 'Erro interno do servidor'
    }, 500);
  }
});

// POST /api/auth/reset-password - Redefinir senha
auth.post("/reset-password", zValidator('json', ResetPasswordSchema), async (c) => {
  try {
    const { token, newPassword } = c.req.valid('json');
    const db = c.env.DB;

    // Buscar token válido
    const resetToken = await db.prepare(`
      SELECT user_id, expires_at 
      FROM password_reset_tokens 
      WHERE token = ? AND expires_at > datetime('now')
    `).bind(token).first();

    if (!resetToken) {
      return c.json({
        success: false,
        error: 'Token inválido ou expirado'
      }, 400);
    }

    // Gerar novo hash da senha
    const { hash, salt } = await hashPassword(newPassword);

    // Atualizar senha do usuário
    await db.prepare(`
      UPDATE users 
      SET password_hash = ?, salt = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(hash, salt, resetToken.user_id as number).run();

    // Remover token usado
    await db.prepare(`
      DELETE FROM password_reset_tokens WHERE token = ?
    `).bind(token).run();

    return c.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro no reset password:', error);
    return c.json({
      success: false,
      error: 'Erro interno do servidor'
    }, 500);
  }
});

// GET /api/auth/me - Obter dados do usuário logado (requer autenticação)
auth.get("/me", async (c) => {
  try {
    // O middleware de auth deve ter definido o usuário
    const user = (c as any).get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Token de autenticação necessário'
      }, 401);
    }

    return c.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return c.json({
      success: false,
      error: 'Erro interno do servidor'
    }, 500);
  }
});

// Middleware de autenticação para rotas protegidas
export function authMiddleware() {
  return async (c: any, next: any) => {
    try {
      const authorization = c.req.header('Authorization');
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return c.json({
          success: false,
          error: 'Token de autenticação necessário'
        }, 401);
      }

      const token = authorization.substring(7); // Remove 'Bearer '
      const env = c.env as any;
      const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-key-change-in-production';

      // Verificar e decodificar JWT
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Buscar dados atuais do usuário no banco
      const db = c.env.DB;
      const user = await db.prepare(`
        SELECT 
          id, name, email, role, clinic_id, phone, avatar, 
          specialties, is_email_verified, is_active
        FROM users 
        WHERE id = ? AND is_active = 1
      `).bind(decoded.userId as number).first();

      if (!user) {
        return c.json({
          success: false,
          error: 'Usuário não encontrado'
        }, 401);
      }

      // Anexar dados do usuário ao contexto
      (c as any).set('user', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinic_id,
        phone: user.phone,
        avatar: user.avatar,
        specialties: user.specialties,
        isEmailVerified: user.is_email_verified
      });

      await next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return c.json({
          success: false,
          error: 'Token inválido'
        }, 401);
      }
      
      console.error('Erro no middleware de auth:', error);
      return c.json({
        success: false,
        error: 'Erro interno do servidor'
      }, 500);
    }
  };
}

// Middleware para verificação de role
export function requireRole(allowedRoles: string[]) {
  return async (c: any, next: any) => {
    const user = (c as any).get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({
        success: false,
        error: 'Acesso negado'
      }, 403);
    }
    
    await next();
  };
}

export { auth };
