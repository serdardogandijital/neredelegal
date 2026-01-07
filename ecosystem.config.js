module.exports = {
  apps: [{
    name: 'nerede-web-admin',
    script: 'npm',
    args: 'start',
    cwd: '/domains/neredeapp.com.tr/public_html/web-admin',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    error_file: '/domains/neredeapp.com.tr/logs/web-admin-error.log',
    out_file: '/domains/neredeapp.com.tr/logs/web-admin-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};

