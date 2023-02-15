import pino from 'pino'

const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } } // Requires "pino-pretty"
    : undefined
})

export const getLogger = (name: string) => logger.child({ name })
