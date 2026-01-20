# Stalkesp - Deployment Guide

## Prerequisites

- Ubuntu 20.04+ VPS (Contabo, Vultr, DigitalOcean, etc.)
- Docker & Docker Compose installed
- Nginx installed
- Domain pointed to your VPS IP

---

## Quick Deploy

```bash
# 1. Clone the repository
git clone https://github.com/cietz/stalkeaesp.git
cd stalkeaesp

# 2. Copy environment file
cp .env.example .env

# 3. Run deploy script
chmod +x deploy.sh
./deploy.sh
```

---

## Manual Setup

### 1. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

### 2. Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/stalkesp

# Enable the site
sudo ln -s /etc/nginx/sites-available/stalkesp /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d es.toxicspy.com

# Auto-renewal is configured automatically
```

### 4. Build and Run

```bash
# Build and start container
sudo docker-compose up -d --build

# Check status
sudo docker ps

# View logs
sudo docker logs -f stalkeaesp
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `sudo docker-compose up -d` | Start container |
| `sudo docker-compose down` | Stop container |
| `sudo docker-compose logs -f` | View logs |
| `sudo docker-compose restart` | Restart container |
| `./deploy.sh` | Full deploy (pull + rebuild) |

---

## Ports

| Service | Internal | External |
|---------|----------|----------|
| App | 3000 | 3001 |
| Nginx | - | 80, 443 |

---

## Troubleshooting

### Container not starting
```bash
sudo docker logs stalkeaesp
```

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/stalkesp_error.log
```
