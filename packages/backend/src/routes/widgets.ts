import { Router, type IRouter } from 'express';
import {
  widgetDataRequestSchema,
  batchWidgetDataRequestSchema,
  type WidgetDataResponse,
} from '@dashboard-builder/shared';
import { MockDataEngine } from '../mock-engine.js';
import { AppError } from '../middleware/error-handler.js';

const router: IRouter = Router();
const mockEngine = new MockDataEngine();

router.post('/data', async (req, res, next) => {
  try {
    const parseResult = widgetDataRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(400, parseResult.error.errors.map((e) => e.message).join(', '));
    }

    const { widgetId, type } = parseResult.data;

    try {
      const data = await mockEngine.generate(type, widgetId);
      const response: WidgetDataResponse = {
        widgetId,
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (error) {
      const response: WidgetDataResponse = {
        widgetId,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate data',
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/data/batch', async (req, res, next) => {
  try {
    const parseResult = batchWidgetDataRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(400, parseResult.error.errors.map((e) => e.message).join(', '));
    }

    const { requests } = parseResult.data;

    const settled = await Promise.allSettled(
      requests.map(async ({ widgetId, type }) => {
        try {
          const data = await mockEngine.generate(type, widgetId);
          return {
            widgetId,
            success: true as const,
            data,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          return {
            widgetId,
            success: false as const,
            error: error instanceof Error ? error.message : 'Failed to generate data',
            timestamp: new Date().toISOString(),
          };
        }
      }),
    );

    const results: WidgetDataResponse[] = settled.map((result, index) => {
      const widgetId = requests[index]?.widgetId ?? 'unknown';
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        widgetId,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    });

    res.json({
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
