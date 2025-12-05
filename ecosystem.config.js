/**
 * NEO-EDU PM2 Ecosystem Configuration
 * Optimized for 1GB RAM environment
 */
module.exports = {
    apps: [
        {
            name: 'neoedu-frontend',
            cwd: './frontend',
            script: 'node_modules/next/dist/bin/next',
            args: 'start',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '300M',
            node_args: '--max-old-space-size=256',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            watch: false,
            autorestart: true,
            exp_backoff_restart_delay: 100,
        },
        {
            name: 'neoedu-backend',
            cwd: './backend',
            script: 'dist/index.js',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '200M',
            node_args: '--max-old-space-size=192',
            env: {
                NODE_ENV: 'production',
                PORT: 4000,
                DATABASE_URL: 'postgresql://neoedu:neoedu_secure_password_change_me@localhost:5432/neoedu_db',
                REDIS_URL: 'redis://localhost:6379',
                JWT_SECRET: 'change_this_to_a_secure_random_string',
                JWT_EXPIRES_IN: '7d',
                UPLOAD_DIR: '/var/lib/neoedu/uploads',
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 4000,
                DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/neoedu_dev',
                REDIS_URL: 'redis://localhost:6379',
                JWT_SECRET: 'dev_secret_key',
                JWT_EXPIRES_IN: '7d',
                UPLOAD_DIR: './uploads',
            },
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            watch: false,
            autorestart: true,
            exp_backoff_restart_delay: 100,
        },
    ],
};
