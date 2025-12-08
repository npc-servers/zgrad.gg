/**
 * Sales API routes for VPS
 * Manages promotional sales shown on the loading screen
 * Admin-only access required for all management endpoints
 */

import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../lib/database.js';
import { validateSession, requireAdmin } from '../middleware/auth.js';
import { 
  secureJsonResponse, 
  checkRateLimit 
} from '../lib/security-utils.js';

const router = Router();

/**
 * GET /api/sales/active - Get currently active sale for loading screen (public)
 * Returns the first enabled sale that is within its date range
 */
router.get('/active', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_active', 120, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const now = Date.now();
    
    // Get the first enabled sale that is currently active
    // Active means: enabled = 1, and either no dates set OR current time is within date range
    const activeSale = query.prepare(
      `SELECT id, title, percentage, description, link_text, link_url, start_date, end_date
       FROM sales 
       WHERE enabled = 1 
         AND (start_date IS NULL OR start_date <= ?)
         AND (end_date IS NULL OR end_date > ?)
       ORDER BY created_at DESC 
       LIMIT 1`
    ).bind(now, now).first();

    if (!activeSale) {
      return secureJsonResponse(res, { 
        active: false,
        sale: null
      });
    }

    return secureJsonResponse(res, { 
      active: true,
      sale: {
        id: activeSale.id,
        title: activeSale.title,
        percentage: activeSale.percentage,
        description: activeSale.description,
        linkText: activeSale.link_text,
        linkUrl: activeSale.link_url,
        startDate: activeSale.start_date,
        endDate: activeSale.end_date
      }
    });
  } catch (error) {
    console.error('Error fetching active sale:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch active sale' }, 500);
  }
});

/**
 * GET /api/sales/list - List all sales (admin only)
 */
router.get('/list', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_list', 60, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const results = query.prepare(
      `SELECT id, title, percentage, description, link_text, link_url, enabled, 
              start_date, end_date, author_id, author_name, created_at, updated_at 
       FROM sales 
       ORDER BY created_at DESC`
    ).all().results;

    return secureJsonResponse(res, { 
      sales: results,
      is_authenticated: true
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch sales' }, 500);
  }
});

/**
 * POST /api/sales/create - Create a new sale (admin only)
 */
router.post('/create', requireAdmin(), async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_create', 10, 3600);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded. Please try again later.' }, 429);
  }

  try {
    const { 
      title, 
      percentage, 
      description, 
      link_text, 
      link_url,
      enabled = false,
      start_date = null,
      end_date = null
    } = req.body;

    if (!title || !percentage || !description || !link_text || !link_url) {
      return secureJsonResponse(res, { 
        error: 'Missing required fields: title, percentage, description, link_text, link_url' 
      }, 400);
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    query.prepare(
      `INSERT INTO sales (id, title, percentage, description, link_text, link_url, enabled, start_date, end_date, author_id, author_name, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 
      title, 
      percentage, 
      description, 
      link_text, 
      link_url,
      enabled ? 1 : 0,
      start_date || null,
      end_date || null,
      req.session.user_id, 
      req.session.username,
      now, 
      now
    ).run();

    return secureJsonResponse(res, {
      success: true,
      sale: { id, title, percentage, description, link_text, link_url, enabled, start_date, end_date, created_at: now },
    }, 201);
  } catch (error) {
    console.error('Error creating sale:', error);
    return secureJsonResponse(res, { error: 'Failed to create sale', details: error.message }, 500);
  }
});

/**
 * GET /api/sales/:id - Get a specific sale (admin only)
 */
router.get('/:id', async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_get', 100, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  const session = await validateSession(req, true);
  if (!session) {
    return secureJsonResponse(res, { error: 'Unauthorized' }, 401);
  }

  try {
    const sale = query.prepare('SELECT * FROM sales WHERE id = ?').bind(req.params.id).first();

    if (!sale) {
      return secureJsonResponse(res, { error: 'Sale not found' }, 404);
    }

    return secureJsonResponse(res, { sale });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return secureJsonResponse(res, { error: 'Failed to fetch sale' }, 500);
  }
});

/**
 * PUT /api/sales/:id - Update a sale (admin only)
 */
router.put('/:id', requireAdmin(), async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_update', 30, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const saleId = req.params.id;
    const { 
      title, 
      percentage, 
      description, 
      link_text, 
      link_url,
      enabled,
      start_date,
      end_date
    } = req.body;

    const existingSale = query.prepare('SELECT * FROM sales WHERE id = ?').bind(saleId).first();
    if (!existingSale) {
      return secureJsonResponse(res, { error: 'Sale not found' }, 404);
    }

    const now = Date.now();

    query.prepare(
      `UPDATE sales 
       SET title = ?, percentage = ?, description = ?, link_text = ?, link_url = ?, 
           enabled = ?, start_date = ?, end_date = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      title !== undefined ? title : existingSale.title,
      percentage !== undefined ? percentage : existingSale.percentage,
      description !== undefined ? description : existingSale.description,
      link_text !== undefined ? link_text : existingSale.link_text,
      link_url !== undefined ? link_url : existingSale.link_url,
      enabled !== undefined ? (enabled ? 1 : 0) : existingSale.enabled,
      start_date !== undefined ? start_date : existingSale.start_date,
      end_date !== undefined ? end_date : existingSale.end_date,
      now,
      saleId
    ).run();

    const updatedSale = query.prepare('SELECT * FROM sales WHERE id = ?').bind(saleId).first();

    return secureJsonResponse(res, {
      success: true,
      sale: updatedSale,
      action_message: 'Sale updated successfully!'
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return secureJsonResponse(res, { error: 'Failed to update sale', details: error.message }, 500);
  }
});

/**
 * DELETE /api/sales/:id - Delete a sale (admin only)
 */
router.delete('/:id', requireAdmin(), async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_delete', 10, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const sale = query.prepare('SELECT id FROM sales WHERE id = ?').bind(req.params.id).first();

    if (!sale) {
      return secureJsonResponse(res, { error: 'Sale not found' }, 404);
    }

    query.prepare('DELETE FROM sales WHERE id = ?').bind(req.params.id).run();

    return secureJsonResponse(res, { 
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return secureJsonResponse(res, { error: 'Failed to delete sale', details: error.message }, 500);
  }
});

/**
 * POST /api/sales/:id/toggle - Toggle sale enabled status (admin only)
 */
router.post('/:id/toggle', requireAdmin(), async (req, res) => {
  const rateLimit = await checkRateLimit(req, 'sales_toggle', 30, 60);
  if (!rateLimit.allowed) {
    return secureJsonResponse(res, { error: 'Rate limit exceeded' }, 429);
  }

  try {
    const saleId = req.params.id;
    
    const existingSale = query.prepare('SELECT * FROM sales WHERE id = ?').bind(saleId).first();
    if (!existingSale) {
      return secureJsonResponse(res, { error: 'Sale not found' }, 404);
    }

    const newEnabled = existingSale.enabled ? 0 : 1;
    const now = Date.now();

    query.prepare(
      'UPDATE sales SET enabled = ?, updated_at = ? WHERE id = ?'
    ).bind(newEnabled, now, saleId).run();

    return secureJsonResponse(res, {
      success: true,
      enabled: newEnabled === 1,
      message: newEnabled ? 'Sale enabled' : 'Sale disabled'
    });
  } catch (error) {
    console.error('Error toggling sale:', error);
    return secureJsonResponse(res, { error: 'Failed to toggle sale', details: error.message }, 500);
  }
});

export default router;
