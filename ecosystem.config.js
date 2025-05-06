module.exports = {
    apps: [
      {
        name: 'my-app',          // Pangalan ng app
        script: 'index.js',      // Entry file
        instances: 1,            // Gamitin mo `max` para sa all CPU cores
        autorestart: true,       // Auto-restart pag nag-crash
        watch: false,            // Pwede mo i-enable kung gusto mo auto-reload pag may changes
        max_memory_restart: '512M', // Restart pag lumampas ng 512MB memory
        env: {
          NODE_ENV: 'development'
        },
        env_production: {
          NODE_ENV: 'production'
        }
      }
    ]
  };
  