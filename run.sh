#!/usr/bin/env bash
set -euo pipefail
# ──────────────────────────────────────────────────────────
#   Dastan — Every Day, a New Tale
#   Local dev + Production deployment manager
# ──────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
DEPLOY_DIR="$ROOT_DIR/deploy"
PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/.logs"

# ── Remote config ───────────────────────────────────────
REMOTE_USER="ubuntu"
REMOTE_HOST="98.84.165.121"
REMOTE_KEY="$HOME/.ssh/id_rsa"
REMOTE_DIR="/home/ubuntu/dastan"
DOMAIN="mydastan.com"
DOMAIN_WWW="www.mydastan.com"
SSH_CMD="ssh -o StrictHostKeyChecking=accept-new -i $REMOTE_KEY $REMOTE_USER@$REMOTE_HOST"

# ── Colors ──────────────────────────────────────────────
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Helpers ─────────────────────────────────────────────

banner() {
    echo ""
    echo -e "${GOLD}${BOLD}"
    echo "    ╔══════════════════════════════════════════╗"
    echo "    ║                                          ║"
    echo "    ║          ●    DASTAN                     ║"
    echo "    ║                                          ║"
    echo "    ║     Every Day, a New Tale                ║"
    echo "    ║                                          ║"
    echo "    ╚══════════════════════════════════════════╝"
    echo -e "${RESET}"
}

step()    { echo -e "  ${GOLD}▸${RESET} $1"; }
success() { echo -e "  ${GREEN}✓${RESET} $1"; }
fail()    { echo -e "  ${RED}✗${RESET} $1"; exit 1; }
warn()    { echo -e "  ${RED}!${RESET} $1"; }
info()    { echo -e "  ${DIM}$1${RESET}"; }

ensure_dirs() {
    mkdir -p "$PID_DIR" "$LOG_DIR"
}

remote_exec() {
    $SSH_CMD "$@"
}

remote_check() {
    $SSH_CMD "echo ok" 2>/dev/null
}

# ── Process management (local) ──────────────────────────

is_running() {
    local name="$1"
    local pidfile="$PID_DIR/$name.pid"
    if [ -f "$pidfile" ]; then
        local pid
        pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
        rm -f "$pidfile"
    fi
    return 1
}

get_pid() {
    local name="$1"
    local pidfile="$PID_DIR/$name.pid"
    [ -f "$pidfile" ] && cat "$pidfile"
}

stop_process() {
    local name="$1"
    local pidfile="$PID_DIR/$name.pid"
    [ ! -f "$pidfile" ] && return 0
    local pid
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null
        local waited=0
        while kill -0 "$pid" 2>/dev/null && [ $waited -lt 5 ]; do
            sleep 1
            waited=$((waited + 1))
        done
        kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null && sleep 1
    fi
    rm -f "$pidfile"
}

kill_port() {
    local port="$1"
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
}

# ══════════════════════════════════════════════════════════
#   LOCAL COMMANDS
# ══════════════════════════════════════════════════════════

do_start() {
    ensure_dirs
    banner

    step "Checking prerequisites..."
    command -v python3 &>/dev/null || fail "Python 3 required"
    command -v node    &>/dev/null || fail "Node.js required"

    local py_ver node_ver
    py_ver=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    node_ver=$(node -v | sed 's/v//')
    success "Python $py_ver, Node $node_ver"

    # Activate venv
    if [ -d "$BACKEND_DIR/venv" ]; then
        source "$BACKEND_DIR/venv/bin/activate"
    else
        step "Creating Python virtual environment..."
        python3 -m venv "$BACKEND_DIR/venv"
        source "$BACKEND_DIR/venv/bin/activate"
        pip install -q -r "$BACKEND_DIR/requirements.txt" 2>&1 | tail -1
        success "Virtual environment ready"
    fi

    # Stop any existing instances
    if is_running "backend" || is_running "frontend"; then
        step "Stopping existing instances..."
        stop_process "backend"
        stop_process "frontend"
        kill_port 8000; kill_port 3000; sleep 1
        success "Previous instances stopped"
    else
        kill_port 8000; kill_port 3000; sleep 1
    fi

    echo ""
    echo -e "  ${BOLD}Launching Dastan (local dev)...${RESET}"
    echo ""

    # Start backend
    step "Starting backend..."
    (cd "$BACKEND_DIR" && \
        uvicorn app.main:app --reload --port 8000 \
        >> "$LOG_DIR/backend.log" 2>&1) &
    echo $! > "$PID_DIR/backend.pid"

    local retries=0
    while [ $retries -lt 15 ]; do
        curl -s http://localhost:8000/ >/dev/null 2>&1 && break
        sleep 1; retries=$((retries + 1))
    done
    curl -s http://localhost:8000/ >/dev/null 2>&1 \
        && success "Backend running on http://localhost:8000" \
        || warn "Backend may still be starting — check: ./run.sh logs backend"

    # Start frontend
    step "Starting frontend..."
    (cd "$FRONTEND_DIR" && \
        npx next dev --port 3000 \
        >> "$LOG_DIR/frontend.log" 2>&1) &
    echo $! > "$PID_DIR/frontend.pid"

    retries=0
    while [ $retries -lt 15 ]; do
        curl -s http://localhost:3000/ >/dev/null 2>&1 && break
        sleep 1; retries=$((retries + 1))
    done
    curl -s http://localhost:3000/ >/dev/null 2>&1 \
        && success "Frontend running on http://localhost:3000" \
        || warn "Frontend may still be starting — check: ./run.sh logs frontend"

    echo ""
    echo -e "${GOLD}${BOLD}    ┌──────────────────────────────────────────┐${RESET}"
    echo -e "${GOLD}${BOLD}    │   ${GREEN}●${GOLD}  Dastan is running (local)           │${RESET}"
    echo -e "${GOLD}${BOLD}    │   App:  ${RESET}${CYAN}http://localhost:3000${RESET}${GOLD}${BOLD}            │${RESET}"
    echo -e "${GOLD}${BOLD}    │   API:  ${RESET}${DIM}http://localhost:8000/docs${RESET}${GOLD}${BOLD}       │${RESET}"
    echo -e "${GOLD}${BOLD}    └──────────────────────────────────────────┘${RESET}"
    echo ""
}

do_stop() {
    banner
    step "Stopping Dastan..."
    local stopped=false
    if is_running "backend"; then stop_process "backend"; success "Backend stopped"; stopped=true; fi
    if is_running "frontend"; then stop_process "frontend"; kill_port 3000; success "Frontend stopped"; stopped=true; fi
    kill_port 8000; kill_port 3000
    [ "$stopped" = false ] && info "Nothing was running"
    echo ""
}

do_status() {
    banner
    echo -e "  ${BOLD}Service Status${RESET}"
    echo ""
    if is_running "backend"; then
        echo -e "  ${GREEN}●${RESET}  Backend    ${DIM}PID $(get_pid backend)${RESET}    ${CYAN}http://localhost:8000${RESET}"
    else
        echo -e "  ${RED}●${RESET}  Backend    ${DIM}stopped${RESET}"
    fi
    if is_running "frontend"; then
        echo -e "  ${GREEN}●${RESET}  Frontend   ${DIM}PID $(get_pid frontend)${RESET}    ${CYAN}http://localhost:3000${RESET}"
    else
        echo -e "  ${RED}●${RESET}  Frontend   ${DIM}stopped${RESET}"
    fi
    echo ""
}

do_logs() {
    local service="${1:-all}"
    if [ "$service" = "backend" ] || [ "$service" = "api" ]; then
        echo -e "${BOLD}── Backend logs ──${RESET}"
        tail -50 "$LOG_DIR/backend.log" 2>/dev/null || echo "  No logs yet"
    elif [ "$service" = "frontend" ] || [ "$service" = "web" ]; then
        echo -e "${BOLD}── Frontend logs ──${RESET}"
        tail -50 "$LOG_DIR/frontend.log" 2>/dev/null || echo "  No logs yet"
    else
        echo -e "${BOLD}── Backend logs ──${RESET}"
        tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "  No logs yet"
        echo ""
        echo -e "${BOLD}── Frontend logs ──${RESET}"
        tail -20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "  No logs yet"
    fi
}

do_restart() { do_stop; sleep 1; do_start; }

do_setup() {
    banner
    echo -e "  ${BOLD}First-time setup${RESET}"
    echo ""

    step "Checking prerequisites..."
    command -v python3 &>/dev/null || fail "Python 3 required"
    command -v node    &>/dev/null || fail "Node.js required"
    command -v npm     &>/dev/null || fail "npm required"
    success "Prerequisites OK"

    step "Checking PostgreSQL..."
    if command -v pg_isready &>/dev/null; then
        pg_isready -q 2>/dev/null || {
            command -v brew &>/dev/null && {
                brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
                sleep 2
            }
            pg_isready -q 2>/dev/null || fail "PostgreSQL not running"
        }
        success "PostgreSQL is running"
    else
        info "pg_isready not found — assuming PostgreSQL is available"
    fi

    step "Creating database..."
    if psql -lqt 2>/dev/null | cut -d\| -f1 | grep -qw dastan; then
        success "Database 'dastan' exists"
    else
        createdb dastan 2>/dev/null && success "Database 'dastan' created" \
            || fail "Could not create database"
    fi

    step "Installing backend dependencies..."
    [ ! -d "$BACKEND_DIR/venv" ] && python3 -m venv "$BACKEND_DIR/venv"
    source "$BACKEND_DIR/venv/bin/activate"
    pip install -q -r "$BACKEND_DIR/requirements.txt" 2>&1 | tail -1
    success "Backend dependencies installed"

    step "Installing frontend dependencies..."
    (cd "$FRONTEND_DIR" && npm install --silent 2>&1 | tail -1)
    success "Frontend dependencies installed"

    [ ! -f "$FRONTEND_DIR/.env.local" ] && {
        echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > "$FRONTEND_DIR/.env.local"
        success "Frontend .env.local created"
    }

    echo ""
    step "Seeding database..."
    (cd "$BACKEND_DIR" && python seed_data.py 2>&1 | tail -3)
    success "Seed data loaded"
    echo ""
    echo -e "  ${GREEN}${BOLD}Setup complete!${RESET} Run ${CYAN}./run.sh start${RESET} to launch."
    echo ""
}

do_seed() {
    banner
    step "Activating environment..."
    source "$BACKEND_DIR/venv/bin/activate"
    step "Seeding database..."
    (cd "$BACKEND_DIR" && python seed_data.py 2>&1 | tail -3)
    success "Seed data loaded"
    echo ""
}


# ══════════════════════════════════════════════════════════
#   REMOTE DEPLOYMENT
# ══════════════════════════════════════════════════════════

do_deploy_remote() {
    banner
    echo -e "  ${BOLD}Deploying to production${RESET}"
    echo -e "  ${DIM}Server: $REMOTE_USER@$REMOTE_HOST${RESET}"
    echo -e "  ${DIM}Domain: https://$DOMAIN_WWW${RESET}"
    echo ""

    # ── 1. Verify SSH connectivity ──
    step "Testing SSH connection..."
    if ! remote_check 2>/dev/null; then
        fail "Cannot SSH to $REMOTE_USER@$REMOTE_HOST — check your key and server"
    fi
    success "SSH connection OK"

    # ── 2. Provision server (idempotent) ──
    step "Provisioning server dependencies..."
    remote_exec "bash -s" <<'PROVISION'
set -e

# Track what was installed
INSTALLED=""

# System packages — always ensure all are present
NEED_INSTALL=false
for cmd in nginx certbot psql python3 curl git; do
    command -v $cmd &>/dev/null || NEED_INSTALL=true
done
dpkg -s python3-venv >/dev/null 2>&1 || NEED_INSTALL=true
dpkg -s postgresql >/dev/null 2>&1 || NEED_INSTALL=true

if [ "$NEED_INSTALL" = true ]; then
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        nginx certbot python3-certbot-nginx \
        python3 python3-venv python3-pip \
        postgresql postgresql-contrib \
        curl git build-essential >/dev/null 2>&1
    sudo systemctl enable --now postgresql >/dev/null 2>&1 || true
    INSTALLED="$INSTALLED system-packages"
fi

# Node.js 20.x
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs >/dev/null 2>&1
    INSTALLED="$INSTALLED node"
fi

# PM2
if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2 >/dev/null 2>&1
    INSTALLED="$INSTALLED pm2"
fi

# Ensure services running
sudo systemctl enable --now nginx >/dev/null 2>&1 || true
sudo systemctl enable --now postgresql >/dev/null 2>&1 || true

# Firewall
if command -v ufw &>/dev/null; then
    sudo ufw allow 'Nginx Full' >/dev/null 2>&1 || true
    sudo ufw allow OpenSSH >/dev/null 2>&1 || true
fi

# certbot directory
sudo mkdir -p /var/www/certbot

# Report
if [ -n "$INSTALLED" ]; then
    echo "INSTALLED:$INSTALLED"
else
    echo "ALL_PRESENT"
fi

# Verify
echo "VERSIONS: python=$(python3 --version 2>&1 | awk '{print $2}') node=$(node -v 2>&1) pm2=$(pm2 -v 2>&1) nginx=$(nginx -v 2>&1 | awk -F/ '{print $NF}')"
PROVISION
    success "Server dependencies ready"

    # ── 3. Setup PostgreSQL ──
    step "Setting up PostgreSQL..."
    remote_exec "bash -s" <<'PGSETUP'
set -e
# Create user and database if not exists
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='dastan'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE USER dastan WITH PASSWORD 'dastan';" >/dev/null 2>&1

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='dastan'" | grep -q 1 \
    || sudo -u postgres createdb -O dastan dastan >/dev/null 2>&1

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dastan TO dastan;" >/dev/null 2>&1

# Ensure pg_hba allows local password auth for dastan user
PG_HBA=$(sudo -u postgres psql -tAc "SHOW hba_file")
if ! sudo grep -q "dastan" "$PG_HBA" 2>/dev/null; then
    echo "local   dastan   dastan   md5" | sudo tee -a "$PG_HBA" >/dev/null
    echo "host    dastan   dastan   127.0.0.1/32   md5" | sudo tee -a "$PG_HBA" >/dev/null
    sudo systemctl reload postgresql
fi

echo "PG_OK"
PGSETUP
    success "PostgreSQL ready"

    # ── 4. Sync code ──
    step "Syncing code to server..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude 'venv' \
        --exclude '.git' \
        --exclude '__pycache__' \
        --exclude '.next' \
        --exclude '.pids' \
        --exclude '.logs' \
        --exclude '*.pyc' \
        -e "ssh -i $REMOTE_KEY" \
        "$ROOT_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/" \
        --quiet
    success "Code synced"

    # ── 5. Write production env files ──
    step "Writing production environment files..."

    # Read local .env values for API keys
    local ANTHROPIC_KEY=""
    local OPENAI_KEY=""
    local GEMINI_KEY=""
    local SUPABASE_URL=""
    local SUPABASE_ANON_KEY=""
    if [ -f "$BACKEND_DIR/.env" ]; then
        ANTHROPIC_KEY=$(grep ANTHROPIC_API_KEY "$BACKEND_DIR/.env" | cut -d= -f2-)
        OPENAI_KEY=$(grep OPENAI_API_KEY "$BACKEND_DIR/.env" | cut -d= -f2-)
        GEMINI_KEY=$(grep GEMINI_API_KEY "$BACKEND_DIR/.env" | cut -d= -f2-)
        SUPABASE_URL=$(grep SUPABASE_URL "$BACKEND_DIR/.env" | cut -d= -f2-)
    fi
    if [ -f "$FRONTEND_DIR/.env.local" ]; then
        SUPABASE_ANON_KEY=$(grep SUPABASE_ANON_KEY "$FRONTEND_DIR/.env.local" | cut -d= -f2-)
        [ -z "$SUPABASE_URL" ] && SUPABASE_URL=$(grep SUPABASE_URL "$FRONTEND_DIR/.env.local" | cut -d= -f2-)
    fi

    # Backend .env
    remote_exec "cat > $REMOTE_DIR/backend/.env" <<ENVEOF
DASTAN_DATABASE_URL=postgresql+asyncpg://dastan:dastan@localhost/dastan
DASTAN_ANTHROPIC_API_KEY=$ANTHROPIC_KEY
DASTAN_OPENAI_API_KEY=$OPENAI_KEY
DASTAN_GEMINI_API_KEY=$GEMINI_KEY
DASTAN_SUPABASE_URL=$SUPABASE_URL
DASTAN_CORS_ORIGINS='["https://$DOMAIN_WWW","https://$DOMAIN","http://localhost:3000"]'
ENVEOF

    # Frontend .env.local — empty API URL so it uses same-origin via nginx
    remote_exec "cat > $REMOTE_DIR/frontend/.env.local" <<ENVEOF
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENVEOF
    success "Environment files written"

    # ── 6. Install dependencies & build ──
    step "Installing backend dependencies..."
    remote_exec "bash -s" <<'BACKEND_INSTALL'
set -e
cd /home/ubuntu/dastan/backend
python3 -m venv venv
source venv/bin/activate
pip install --quiet --upgrade pip >/dev/null 2>&1
pip install --quiet -r requirements.txt 2>&1 | tail -1
echo "BACKEND_DEPS_OK"
BACKEND_INSTALL
    success "Backend dependencies installed"

    step "Installing frontend dependencies & building..."
    remote_exec "bash -s" <<'FRONTEND_BUILD'
set -e
cd /home/ubuntu/dastan/frontend
npm ci --silent 2>&1 | tail -1
npx next build 2>&1 | tail -5
echo "FRONTEND_BUILD_OK"
FRONTEND_BUILD
    success "Frontend built"

    # ── 7. Run database seed ──
    # Always re-seed so DATES (a rolling 7-day window ending today) is fresh.
    # The seeder clears non-source content before inserting, so this is idempotent.
    step "Seeding database (rolling 7-day window)..."
    remote_exec "bash -s" <<'SEED'
set -e
cd /home/ubuntu/dastan/backend
source venv/bin/activate
python3 seed_data.py 2>&1 | tail -3
echo "SEEDED"
SEED
    success "Database seeded"

    # ── 8. Deploy nginx config ──
    step "Configuring nginx..."
    local HAS_CERTS
    HAS_CERTS=$(remote_exec "test -d /etc/letsencrypt/live/$DOMAIN_WWW && echo yes || echo no")

    if [ "$HAS_CERTS" = "yes" ]; then
        # Full SSL config
        remote_exec "sudo cp $REMOTE_DIR/deploy/nginx.conf /etc/nginx/sites-available/dastan"
        info "Using SSL config (certs exist)"
    else
        # Initial HTTP-only config (for certbot to run)
        remote_exec "sudo cp $REMOTE_DIR/deploy/nginx-initial.conf /etc/nginx/sites-available/dastan"
        info "Using initial HTTP config (will add SSL next)"
    fi

    remote_exec "bash -s" <<'NGINX_ENABLE'
set -e
sudo ln -sf /etc/nginx/sites-available/dastan /etc/nginx/sites-enabled/dastan
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t 2>&1
sudo systemctl reload nginx
echo "NGINX_OK"
NGINX_ENABLE
    success "Nginx configured"

    # ── 9. Start/restart services with PM2 ──
    step "Starting services with PM2..."
    remote_exec "bash -s" <<'PM2_START'
set -e
cd /home/ubuntu/dastan

# Source backend env
set -a
source backend/.env
set +a

# Stop existing
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start fresh
pm2 start deploy/ecosystem.config.js --env production
pm2 save >/dev/null 2>&1

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1 | grep "sudo" | bash 2>/dev/null || true

echo "PM2_OK"
PM2_START
    success "Services started"

    # ── 10. Wait for services to be healthy ──
    step "Waiting for services to be healthy..."
    local healthy=false
    for i in $(seq 1 20); do
        local backend_ok frontend_ok
        backend_ok=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/ 2>/dev/null || echo 000")
        frontend_ok=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ 2>/dev/null || echo 000")

        if [ "$backend_ok" = "200" ] && [ "$frontend_ok" != "000" ]; then
            healthy=true
            break
        fi
        sleep 2
    done

    if [ "$healthy" = true ]; then
        success "Backend: healthy (200)"
        success "Frontend: healthy"
    else
        warn "Services may still be starting. Check: ./run.sh remote-logs"
        remote_exec "pm2 logs --lines 20 --nostream" 2>/dev/null || true
    fi

    # ── 11. SSL certificate ──
    if [ "$HAS_CERTS" = "no" ]; then
        step "Obtaining SSL certificate..."

        # First verify HTTP works (certbot needs this)
        local http_check
        http_check=$(curl -s -o /dev/null -w '%{http_code}' "http://$DOMAIN/" 2>/dev/null || echo "000")
        if [ "$http_check" = "000" ]; then
            warn "Cannot reach http://$DOMAIN — check DNS and firewall"
            warn "SSL setup skipped. Run './run.sh ssl' manually later."
        else
            remote_exec "sudo certbot --nginx \
                -d $DOMAIN -d $DOMAIN_WWW \
                --non-interactive --agree-tos \
                --email admin@$DOMAIN \
                --redirect" 2>&1 | tail -5

            # Verify cert was obtained
            if remote_exec "test -d /etc/letsencrypt/live/$DOMAIN_WWW && echo yes" 2>/dev/null | grep -q yes; then
                # Now deploy the full SSL nginx config
                remote_exec "sudo cp $REMOTE_DIR/deploy/nginx.conf /etc/nginx/sites-available/dastan"
                remote_exec "sudo nginx -t 2>&1 && sudo systemctl reload nginx"
                success "SSL certificate obtained and configured"
            else
                warn "Certbot may have failed. Run './run.sh ssl' manually."
            fi
        fi
    else
        step "Renewing SSL certificate (if needed)..."
        remote_exec "sudo certbot renew --quiet 2>&1" || true
        success "SSL certificate up to date"
    fi

    # ── 12. Final verification ──
    echo ""
    step "Running final checks..."
    echo ""

    # Check HTTPS
    local https_code
    https_code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN_WWW/" 2>/dev/null || echo "000")
    if [ "$https_code" = "200" ] || [ "$https_code" = "307" ] || [ "$https_code" = "308" ]; then
        success "https://$DOMAIN_WWW → $https_code"
    else
        # Try HTTP as fallback check
        local http_code
        http_code=$(curl -s -o /dev/null -w '%{http_code}' "http://$DOMAIN/" 2>/dev/null || echo "000")
        if [ "$http_code" = "200" ] || [ "$http_code" = "301" ]; then
            success "http://$DOMAIN → $http_code (SSL may still be propagating)"
        else
            warn "https://$DOMAIN_WWW → $https_code (may need DNS propagation)"
        fi
    fi

    # Check API
    local api_code
    api_code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN_WWW/api/canvas/today" 2>/dev/null || echo "000")
    if [ "$api_code" = "200" ]; then
        success "API endpoint → 200"
    elif [ "$api_code" = "000" ]; then
        api_code=$(curl -s -o /dev/null -w '%{http_code}' "http://$DOMAIN/api/canvas/today" 2>/dev/null || echo "000")
        [ "$api_code" = "200" ] && success "API endpoint (HTTP) → 200" || warn "API check: $api_code"
    else
        warn "API endpoint → $api_code"
    fi

    # PM2 process status
    echo ""
    remote_exec "pm2 list" 2>/dev/null || true

    echo ""
    echo -e "${GOLD}${BOLD}    ┌──────────────────────────────────────────┐${RESET}"
    echo -e "${GOLD}${BOLD}    │                                          │${RESET}"
    echo -e "${GOLD}${BOLD}    │   ${GREEN}●${GOLD}  Dastan deployed to production       │${RESET}"
    echo -e "${GOLD}${BOLD}    │                                          │${RESET}"
    echo -e "${GOLD}${BOLD}    │   Site:  ${RESET}${CYAN}https://$DOMAIN_WWW${RESET}${GOLD}${BOLD}    │${RESET}"
    echo -e "${GOLD}${BOLD}    │   API:   ${RESET}${DIM}https://$DOMAIN_WWW/docs${RESET}${GOLD}${BOLD}   │${RESET}"
    echo -e "${GOLD}${BOLD}    │                                          │${RESET}"
    echo -e "${GOLD}${BOLD}    │   Logs:    ${RESET}${DIM}./run.sh remote-logs${RESET}${GOLD}${BOLD}        │${RESET}"
    echo -e "${GOLD}${BOLD}    │   Status:  ${RESET}${DIM}./run.sh remote-status${RESET}${GOLD}${BOLD}      │${RESET}"
    echo -e "${GOLD}${BOLD}    │   Redeploy:${RESET}${DIM}./run.sh deploy remote${RESET}${GOLD}${BOLD}      │${RESET}"
    echo -e "${GOLD}${BOLD}    │                                          │${RESET}"
    echo -e "${GOLD}${BOLD}    └──────────────────────────────────────────┘${RESET}"
    echo ""
}

do_deploy_local() {
    banner
    echo -e "  ${BOLD}Building & running production locally${RESET}"
    echo ""

    source "$BACKEND_DIR/venv/bin/activate" 2>/dev/null || {
        python3 -m venv "$BACKEND_DIR/venv"
        source "$BACKEND_DIR/venv/bin/activate"
        pip install -q -r "$BACKEND_DIR/requirements.txt"
    }

    step "Building frontend..."
    (cd "$FRONTEND_DIR" && npx next build 2>&1 | tail -5)
    success "Frontend built"

    # Stop existing
    kill_port 8000; kill_port 3000; sleep 1

    step "Starting backend (production)..."
    (cd "$BACKEND_DIR" && \
        uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 \
        >> "$LOG_DIR/backend.log" 2>&1) &
    echo $! > "$PID_DIR/backend.pid"

    step "Starting frontend (production)..."
    (cd "$FRONTEND_DIR" && \
        npx next start --port 3000 \
        >> "$LOG_DIR/frontend.log" 2>&1) &
    echo $! > "$PID_DIR/frontend.pid"

    sleep 3
    success "Local production build running on http://localhost:3000"
    echo ""
}

do_deploy() {
    local target="${1:-remote}"
    case "$target" in
        local)  do_deploy_local ;;
        remote) do_deploy_remote ;;
        all)    do_deploy_local; do_deploy_remote ;;
        *)      fail "Unknown deploy target: $target. Use: local, remote, all" ;;
    esac
}

# ══════════════════════════════════════════════════════════
#   REMOTE MANAGEMENT
# ══════════════════════════════════════════════════════════

do_remote_status() {
    banner
    echo -e "  ${BOLD}Remote Status${RESET} — $REMOTE_HOST"
    echo ""
    remote_exec "pm2 list" 2>/dev/null || warn "PM2 not running"
    echo ""

    local https_code
    https_code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN_WWW/" 2>/dev/null || echo "000")
    echo -e "  HTTPS: ${CYAN}https://$DOMAIN_WWW${RESET} → $https_code"

    local api_code
    api_code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN_WWW/api/canvas/today" 2>/dev/null || echo "000")
    echo -e "  API:   ${CYAN}https://$DOMAIN_WWW/api/canvas/today${RESET} → $api_code"
    echo ""
}

do_remote_logs() {
    local service="${1:-all}"
    if [ "$service" = "backend" ]; then
        remote_exec "pm2 logs dastan-backend --lines 50 --nostream" 2>/dev/null
    elif [ "$service" = "frontend" ]; then
        remote_exec "pm2 logs dastan-frontend --lines 50 --nostream" 2>/dev/null
    else
        remote_exec "pm2 logs --lines 30 --nostream" 2>/dev/null
    fi
}

do_remote_stop() {
    banner
    step "Stopping remote services..."
    remote_exec "pm2 stop all" 2>/dev/null || true
    success "Remote services stopped"
    echo ""
}

do_remote_restart() {
    banner
    step "Restarting remote services..."
    remote_exec "pm2 restart all" 2>/dev/null || true
    success "Remote services restarted"
    echo ""
}

do_ssl() {
    banner
    step "Setting up SSL for $DOMAIN_WWW..."

    # Ensure initial nginx config is in place
    remote_exec "sudo cp $REMOTE_DIR/deploy/nginx-initial.conf /etc/nginx/sites-available/dastan" 2>/dev/null
    remote_exec "sudo ln -sf /etc/nginx/sites-available/dastan /etc/nginx/sites-enabled/dastan" 2>/dev/null
    remote_exec "sudo nginx -t && sudo systemctl reload nginx" 2>/dev/null

    # Run certbot
    remote_exec "sudo certbot --nginx \
        -d $DOMAIN -d $DOMAIN_WWW \
        --non-interactive --agree-tos \
        --email admin@$DOMAIN \
        --redirect" 2>&1

    # Deploy full SSL config
    if remote_exec "test -d /etc/letsencrypt/live/$DOMAIN_WWW && echo yes" 2>/dev/null | grep -q yes; then
        remote_exec "sudo cp $REMOTE_DIR/deploy/nginx.conf /etc/nginx/sites-available/dastan"
        remote_exec "sudo nginx -t && sudo systemctl reload nginx"
        success "SSL certificate configured"
    else
        fail "Certbot failed to obtain certificate"
    fi
    echo ""
}

do_remote_seed() {
    banner
    step "Seeding remote database..."
    remote_exec "cd $REMOTE_DIR/backend && source venv/bin/activate && python3 seed_data.py" 2>&1 | tail -5
    success "Remote database seeded"
    echo ""
}

# ══════════════════════════════════════════════════════════
#   MAIN
# ══════════════════════════════════════════════════════════

COMMAND="${1:-start}"
shift 2>/dev/null || true

case "$COMMAND" in
    start)          do_start ;;
    stop)           do_stop ;;
    restart)        do_restart ;;
    status)         do_status ;;
    logs)           do_logs "$@" ;;
    setup)          do_setup ;;
    seed)           do_seed ;;

    deploy)         do_deploy "$@" ;;
    ssl)            do_ssl ;;

    remote-status)  do_remote_status ;;
    remote-logs)    do_remote_logs "$@" ;;
    remote-stop)    do_remote_stop ;;
    remote-restart) do_remote_restart ;;
    remote-seed)    do_remote_seed ;;

    help|-h|--help)
        banner
        echo -e "  ${BOLD}Usage:${RESET}  ./run.sh <command>"
        echo ""
        echo -e "  ${BOLD}Local Development:${RESET}"
        echo "    start           Start dev servers (default)"
        echo "    stop            Stop all local services"
        echo "    restart         Stop + start"
        echo "    status          Show local service status"
        echo "    logs [svc]      Show logs (all | backend | frontend)"
        echo "    setup           First-time install (deps, DB, seed)"
        echo "    seed            Re-seed the local database"
        echo ""
        echo -e "  ${BOLD}Deployment:${RESET}"
        echo "    deploy remote   Deploy to production server"
        echo "    deploy local    Build & run production locally"
        echo "    deploy all      Both local and remote"
        echo "    ssl             Setup/renew SSL certificate"
        echo ""
        echo -e "  ${BOLD}Remote Management:${RESET}"
        echo "    remote-status   Check production health"
        echo "    remote-logs     View production logs"
        echo "    remote-restart  Restart production services"
        echo "    remote-stop     Stop production services"
        echo "    remote-seed     Seed production database"
        echo ""
        echo -e "  ${DIM}Server: $REMOTE_USER@$REMOTE_HOST → https://$DOMAIN_WWW${RESET}"
        echo ""
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${RESET}"
        echo "Run ./run.sh help for usage"
        exit 1
        ;;
esac
