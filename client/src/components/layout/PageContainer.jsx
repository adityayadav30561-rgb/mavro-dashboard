import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Page container with title, description, and optional action slot.
 * Wraps page content with consistent spacing and animations.
 */
export default function PageContainer({ title, description, action, children, className }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page header */}
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <motion.h1
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold tracking-tight"
              >
                {title}
              </motion.h1>
            )}
            {description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-muted-foreground mt-1"
              >
                {description}
              </motion.p>
            )}
          </div>
          {action && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-shrink-0"
            >
              {action}
            </motion.div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
