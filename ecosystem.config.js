module.exports = {
  apps: [{
    name: 'edupro-backend',
    script: './backend/src/server.js',
    cwd: '/var/www/EduPro',
    instances: 1,
    exec_mode: 'cluster',
    
    // 环境配置
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001,
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    
    // 日志配置
    log_file: '/var/log/edupro/combined.log',
    out_file: '/var/log/edupro/out.log',
    error_file: '/var/log/edupro/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 性能配置
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 进程配置
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // 监控配置
    pmx: true,
    automation: false,
    
    // 异常处理
    catch_exceptions: true,
    ignore_watch: ['node_modules', 'backend/src/uploads', 'logs'],
    
    // 高级配置
    node_args: [
      '--harmony',
      '--max-old-space-size=2048'
    ]
  }]
};
