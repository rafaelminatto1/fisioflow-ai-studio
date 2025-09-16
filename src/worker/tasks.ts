import { Context } from 'hono'

interface Task {
  id?: number
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  due_date?: string
  assigned_to?: number
  patient_id?: number
  category: string
  progress: number
  clinic_id: number
  user_id: number
}

export async function getTasks(c: Context) {
  try {
    const db = c.env.DB
    const user = c.get('user')

    if (!user || !user.clinic_id) {
      return c.json({ success: false, error: 'Usuário não autenticado' }, 401)
    }

    const tasks = await db.prepare(`
      SELECT t.*, p.name as patient_name
      FROM tasks t
      LEFT JOIN patients p ON t.patient_id = p.id
      WHERE t.clinic_id = ?
      ORDER BY 
        CASE t.priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        t.due_date ASC,
        t.created_at DESC
    `).bind(user.clinic_id).all()

    return c.json({ success: true, data: tasks.results })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500)
  }
}

export async function createTask(c: Context) {
  try {
    const db = c.env.DB
    const user = c.get('user')
    
    if (!user || !user.clinic_id) {
      return c.json({ success: false, error: 'Usuário não autenticado' }, 401)
    }

    const taskData: Task = await c.req.json()
    
    const result = await db.prepare(`
      INSERT INTO tasks (
        title, description, priority, status, due_date, 
        assigned_to, patient_id, category, progress,
        clinic_id, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      taskData.title,
      taskData.description || null,
      taskData.priority,
      taskData.status,
      taskData.due_date || null,
      taskData.assigned_to || user.id,
      taskData.patient_id || null,
      taskData.category,
      0, // Initial progress
      user.clinic_id,
      user.id
    ).run()

    if (result.success) {
      return c.json({ success: true, data: { id: result.meta.last_row_id } })
    } else {
      return c.json({ success: false, error: 'Erro ao criar tarefa' }, 500)
    }
  } catch (error) {
    console.error('Error creating task:', error)
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500)
  }
}

export async function updateTask(c: Context) {
  try {
    const db = c.env.DB
    const user = c.get('user')
    const taskId = c.req.param('id')
    
    if (!user || !user.clinic_id) {
      return c.json({ success: false, error: 'Usuário não autenticado' }, 401)
    }

    const taskData: Partial<Task> = await c.req.json()
    
    // Verify task belongs to user's clinic
    const existingTask = await db.prepare(`
      SELECT id FROM tasks WHERE id = ? AND clinic_id = ?
    `).bind(taskId, user.clinic_id).first()

    if (!existingTask) {
      return c.json({ success: false, error: 'Tarefa não encontrada' }, 404)
    }

    const result = await db.prepare(`
      UPDATE tasks SET 
        title = ?, description = ?, priority = ?, status = ?, 
        due_date = ?, patient_id = ?, category = ?, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(
      taskData.title,
      taskData.description || null,
      taskData.priority,
      taskData.status,
      taskData.due_date || null,
      taskData.patient_id || null,
      taskData.category,
      taskId,
      user.clinic_id
    ).run()

    if (result.success) {
      return c.json({ success: true, data: { id: taskId } })
    } else {
      return c.json({ success: false, error: 'Erro ao atualizar tarefa' }, 500)
    }
  } catch (error) {
    console.error('Error updating task:', error)
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500)
  }
}

export async function deleteTask(c: Context) {
  try {
    const db = c.env.DB
    const user = c.get('user')
    const taskId = c.req.param('id')
    
    if (!user || !user.clinic_id) {
      return c.json({ success: false, error: 'Usuário não autenticado' }, 401)
    }

    // Verify task belongs to user's clinic
    const existingTask = await db.prepare(`
      SELECT id FROM tasks WHERE id = ? AND clinic_id = ?
    `).bind(taskId, user.clinic_id).first()

    if (!existingTask) {
      return c.json({ success: false, error: 'Tarefa não encontrada' }, 404)
    }

    const result = await db.prepare(`
      DELETE FROM tasks WHERE id = ? AND clinic_id = ?
    `).bind(taskId, user.clinic_id).run()

    if (result.success) {
      return c.json({ success: true })
    } else {
      return c.json({ success: false, error: 'Erro ao excluir tarefa' }, 500)
    }
  } catch (error) {
    console.error('Error deleting task:', error)
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500)
  }
}

export async function updateTaskProgress(c: Context) {
  try {
    const db = c.env.DB
    const user = c.get('user')
    const taskId = c.req.param('id')
    
    if (!user || !user.clinic_id) {
      return c.json({ success: false, error: 'Usuário não autenticado' }, 401)
    }

    const { progress } = await c.req.json()
    
    // Verify task belongs to user's clinic
    const existingTask = await db.prepare(`
      SELECT id FROM tasks WHERE id = ? AND clinic_id = ?
    `).bind(taskId, user.clinic_id).first()

    if (!existingTask) {
      return c.json({ success: false, error: 'Tarefa não encontrada' }, 404)
    }

    // Auto-update status based on progress
    let status = 'IN_PROGRESS'
    if (progress === 0) {
      status = 'PENDING'
    } else if (progress === 100) {
      status = 'COMPLETED'
    }

    const result = await db.prepare(`
      UPDATE tasks SET 
        progress = ?, status = ?, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(progress, status, taskId, user.clinic_id).run()

    if (result.success) {
      return c.json({ success: true })
    } else {
      return c.json({ success: false, error: 'Erro ao atualizar progresso' }, 500)
    }
  } catch (error) {
    console.error('Error updating task progress:', error)
    return c.json({ success: false, error: 'Erro interno do servidor' }, 500)
  }
}
