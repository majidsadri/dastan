module.exports = {
  apps: [
    {
      name: "dastan-backend",
      cwd: "/home/ubuntu/dastan/backend",
      script: "/home/ubuntu/dastan/deploy/start-backend.sh",
      interpreter: "/bin/bash",
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "dastan-frontend",
      cwd: "/home/ubuntu/dastan/frontend",
      script: "node_modules/.bin/next",
      args: "start --port 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
