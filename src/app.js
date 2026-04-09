import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initDatabase();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function parseTaskId(req, res, next) {
  const raw = req.params.id;
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  req.taskId = id;
  next();
}

function handleDbError(res, err) {
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

/**
 * @api {get} /tasks Get all tasks
 * @apiName GetTasks
 * @apiGroup Tasks
 * @apiDescription Returns every task in the database as an array.
 *
 * @apiSuccess {Object[]} tasks Array of task objects.
 * @apiSuccess {Number} tasks.id Task ID.
 * @apiSuccess {String} tasks.title Task title.
 * @apiSuccess {String} [tasks.description] Task description.
 * @apiSuccess {String} tasks.status Task status (`pending` or `completed`).
 * @apiSuccess {String} [tasks.due_date] Due date (ISO date string).
 * @apiSuccess {String} tasks.created_at Creation timestamp.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": 1,
 *         "title": "Example",
 *         "description": "Desc",
 *         "status": "pending",
 *         "due_date": "2026-01-15",
 *         "created_at": "2026-03-26 12:00:00"
 *       }
 *     ]
 *
 * @apiError (Error 500) {Object} body
 * @apiError (Error 500) {String} body.error Server error message.
 */
app.get('/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
    res.json(tasks);
  } catch (err) {
    handleDbError(res, err);
  }
});

/**
 * @api {get} /tasks/:id Get task by ID
 * @apiName GetTaskById
 * @apiGroup Tasks
 * @apiDescription Returns a single task. Responds with 404 if the ID is invalid or missing.
 *
 * @apiParam {Number} id Task ID (path).
 *
 * @apiSuccess {Number} id Task ID.
 * @apiSuccess {String} title Task title.
 * @apiSuccess {String} [description] Task description.
 * @apiSuccess {String} status Task status.
 * @apiSuccess {String} [due_date] Due date.
 * @apiSuccess {String} created_at Creation timestamp.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id": 1,
 *       "title": "Example",
 *       "description": "Desc",
 *       "status": "pending",
 *       "due_date": "2026-01-15",
 *       "created_at": "2026-03-26 12:00:00"
 *     }
 *
 * @apiError (Error 404) {Object} body
 * @apiError (Error 404) {String} body.error Not found message.
 * @apiError (Error 500) {Object} body
 * @apiError (Error 500) {String} body.error Server error message.
 */
app.get('/tasks/:id', parseTaskId, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    handleDbError(res, err);
  }
});

/**
 * @api {post} /tasks Create task
 * @apiName CreateTask
 * @apiGroup Tasks
 * @apiDescription Creates a new task. `title` is required.
 *
 * @apiParam {String} title Task title (body, required).
 * @apiParam {String} [description] Task description (body).
 * @apiParam {String} [status] Status; defaults to `pending` (body).
 * @apiParam {String} [due_date] Due date (body).
 *
 * @apiSuccess (Created 201) {Number} id New task ID.
 * @apiSuccess (Created 201) {String} title Task title.
 * @apiSuccess (Created 201) {String} [description] Description.
 * @apiSuccess (Created 201) {String} status Status.
 * @apiSuccess (Created 201) {String} [due_date] Due date.
 * @apiSuccess (Created 201) {String} created_at Creation timestamp.
 *
 * @apiError (Error 400) {Object} body
 * @apiError (Error 400) {String} body.error Validation error (e.g. missing title).
 * @apiError (Error 500) {Object} body
 * @apiError (Error 500) {String} body.error Server error message.
 */
app.post('/tasks', (req, res) => {
  try {
    const { title, description, status, due_date } = req.body ?? {};
    if (title === undefined || title === null || String(title).trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    const stmt = db.prepare(
      `INSERT INTO tasks (title, description, status, due_date)
       VALUES (@title, @description, COALESCE(@status, 'pending'), @due_date)`
    );
    const info = stmt.run({
      title: String(title).trim(),
      description: description != null ? String(description) : null,
      status: status != null ? String(status) : null,
      due_date: due_date != null ? String(due_date) : null,
    });
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    handleDbError(res, err);
  }
});

/**
 * @api {put} /tasks/:id Update task
 * @apiName UpdateTask
 * @apiGroup Tasks
 * @apiDescription Updates fields on an existing task. Omitted fields keep their previous values.
 *
 * @apiParam {Number} id Task ID (path).
 * @apiParam {String} [title] New title (body).
 * @apiParam {String} [description] New description (body).
 * @apiParam {String} [status] New status (body).
 * @apiParam {String} [due_date] New due date (body).
 *
 * @apiSuccess {Number} id Task ID.
 * @apiSuccess {String} title Task title.
 * @apiSuccess {String} [description] Description.
 * @apiSuccess {String} status Status.
 * @apiSuccess {String} [due_date] Due date.
 * @apiSuccess {String} created_at Creation timestamp.
 *
 * @apiError (Error 404) {Object} body
 * @apiError (Error 404) {String} body.error Task not found.
 * @apiError (Error 500) {Object} body
 * @apiError (Error 500) {String} body.error Server error message.
 */
app.put('/tasks/:id', parseTaskId, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.taskId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const { title, description, status, due_date } = req.body ?? {};
    const updated = {
      title: title !== undefined ? String(title).trim() : existing.title,
      description: description !== undefined ? (description == null ? null : String(description)) : existing.description,
      status: status !== undefined ? String(status) : existing.status,
      due_date: due_date !== undefined ? (due_date == null ? null : String(due_date)) : existing.due_date,
    };
    if (updated.title === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    db.prepare(
      `UPDATE tasks SET title = @title, description = @description, status = @status, due_date = @due_date WHERE id = @id`
    ).run({ ...updated, id: req.taskId });
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.taskId);
    res.json(task);
  } catch (err) {
    handleDbError(res, err);
  }
});

/**
 * @api {delete} /tasks/:id Delete task
 * @apiName DeleteTask
 * @apiGroup Tasks
 * @apiDescription Deletes a task by ID. Returns a confirmation message.
 *
 * @apiParam {Number} id Task ID (path).
 *
 * @apiSuccess {String} message Confirmation message.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Task deleted successfully"
 *     }
 *
 * @apiError (Error 404) {Object} body
 * @apiError (Error 404) {String} body.error Task not found.
 * @apiError (Error 500) {Object} body
 * @apiError (Error 500) {String} body.error Server error message.
 */
app.delete('/tasks/:id', parseTaskId, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.taskId);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    handleDbError(res, err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Task Manager API listening on http://localhost:${PORT}`);
});
