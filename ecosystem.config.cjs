module.exports = {
  apps: [
    {
      name: 'tbm',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: '3333',
      },
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      time: true,
    },
  ],
};
