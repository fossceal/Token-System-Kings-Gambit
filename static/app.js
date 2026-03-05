/* ═══════════════════════════════════════════
   King's Gambit Token System — App Logic
   ═══════════════════════════════════════════ */

const API = location.port === '8000' ? '' : 'http://127.0.0.1:8000';

// ── DOM refs ─────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const teamsList = $('#teams-list');
const audienceList = $('#audience-list');
const teamCount = $('#team-count');
const audienceCount = $('#audience-count');
const leaderboardBox = $('#leaderboard-container');
const transferTeamSel = $('#transfer-team');
const transferAudSel = $('#transfer-audience');
const rewardTeamSel = $('#reward-team');

// ── Toast ────────────────────────────────
function toast(message, type = 'success') {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toast-out 0.3s ease-in forwards';
        el.addEventListener('animationend', () => el.remove());
    }, 3000);
}

// ── API helpers ──────────────────────────
async function api(path, options = {}) {
    try {
        const res = await fetch(`${API}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        const data = await res.json();
        if (data.error) {
            toast(data.error, 'error');
            return null;
        }
        return data;
    } catch (err) {
        toast('Network error — is the server running?', 'error');
        console.error(err);
        return null;
    }
}

// ── Fetch & Render: Teams ────────────────
async function fetchTeams() {
    const teams = await api('/teams');
    if (!teams) return;
    teamCount.textContent = teams.length;
    if (teams.length === 0) {
        teamsList.innerHTML = '<li class="empty-state">No teams registered yet</li>';
    } else {
        teamsList.innerHTML = teams.map(t => `
            <li class="entity-item">
                <div>
                    <span class="entity-name">${esc(t.name)}</span>
                    <span class="entity-meta">${esc(t.branch)} · Y${t.year}</span>
                </div>
                <span class="entity-credits">${t.credits} ₮</span>
            </li>
        `).join('');
    }
    populateSelect(transferTeamSel, teams, 'Select Team');
    populateSelect(rewardTeamSel, teams, 'Select Team');
}

// ── Fetch & Render: Audience ─────────────
async function fetchAudience() {
    const audience = await api('/audience');
    if (!audience) return;
    audienceCount.textContent = audience.length;
    if (audience.length === 0) {
        audienceList.innerHTML = '<li class="empty-state">No audience members yet</li>';
    } else {
        audienceList.innerHTML = audience.map(a => `
            <li class="entity-item">
                <div>
                    <span class="entity-name">${esc(a.name)}</span>
                    <span class="entity-meta">${esc(a.branch)} · Y${a.year}</span>
                </div>
                <span class="entity-credits">${a.credits} ₮</span>
            </li>
        `).join('');
    }
    populateSelect(transferAudSel, audience, 'Select Audience');
}

// ── Fetch & Render: Leaderboard ──────────
async function fetchLeaderboard() {
    const teams = await api('/leaderboard');
    if (!teams) return;
    if (teams.length === 0) {
        leaderboardBox.innerHTML = '<div class="lb-empty">No teams on the board yet — register some!</div>';
        return;
    }
    const maxCredits = Math.max(...teams.map(t => t.credits), 1);
    leaderboardBox.innerHTML = teams.map((t, i) => {
        const rank = i + 1;
        const pct = (t.credits / maxCredits) * 100;
        const rankClass = rank <= 3 ? ` lb-rank-${rank}` : '';
        const medal = rank === 1 ? '<i class="fa-solid fa-trophy" style="color: var(--gold-light)"></i>' : rank === 2 ? '<i class="fa-solid fa-medal" style="color: #cbd5e1"></i>' : rank === 3 ? '<i class="fa-solid fa-medal" style="color: #b45309"></i>' : `#${rank}`;
        return `
            <div class="lb-row" style="animation-delay: ${i * 0.06}s">
                <div class="lb-rank${rankClass}">${medal}</div>
                <div class="lb-info">
                    <div class="lb-name">${esc(t.name)}</div>
                    <div class="lb-details">${esc(t.branch)} · Year ${t.year}</div>
                </div>
                <div class="lb-bar-container">
                    <div class="lb-bar" style="width: ${pct}%"></div>
                </div>
                <div class="lb-credits">${t.credits} ₮</div>
            </div>
        `;
    }).join('');
}

// ── Helpers ──────────────────────────────
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function populateSelect(select, items, placeholder) {
    const current = select.value;
    select.innerHTML = `<option value="" disabled selected>${placeholder}</option>` +
        items.map(item => `<option value="${item.id}">${esc(item.name)} (${item.credits} ₮)</option>`).join('');
    if (current) {
        const exists = [...select.options].some(o => o.value === current);
        if (exists) select.value = current;
    }
}

function resetForm(form) {
    form.reset();
}

// ── Form Handlers ────────────────────────
$('#add-team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: $('#team-name').value.trim(),
        branch: $('#team-branch').value.trim(),
        year: parseInt($('#team-year').value),
        initial_credits: parseInt($('#team-credits').value),
    };
    const result = await api('/teams', { method: 'POST', body: JSON.stringify(data) });
    if (result) {
        toast(`Team "${data.name}" created with ${data.initial_credits} ₮`);
        resetForm(e.target);
        refreshAll();
    }
});

$('#add-audience-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: $('#audience-name').value.trim(),
        branch: $('#audience-branch').value.trim(),
        year: parseInt($('#audience-year').value),
    };
    const result = await api('/audience', { method: 'POST', body: JSON.stringify(data) });
    if (result) {
        toast(`Audience member "${data.name}" registered`);
        resetForm(e.target);
        refreshAll();
    }
});

$('#transfer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        team_id: parseInt($('#transfer-team').value),
        audience_id: parseInt($('#transfer-audience').value),
        amount: parseInt($('#transfer-amount').value),
    };
    const result = await api('/transfer', { method: 'POST', body: JSON.stringify(data) });
    if (result && result.message) {
        toast(`Transferred ${data.amount} ₮ — Team: ${result.team_balance} ₮ | Audience: ${result.audience_balance} ₮`);
        $('#transfer-amount').value = '';
        refreshAll();
    }
});

$('#reward-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        team_id: parseInt($('#reward-team').value),
        amount: parseInt($('#reward-amount').value),
    };
    const result = await api('/reward', { method: 'POST', body: JSON.stringify(data) });
    if (result && result.message) {
        toast(`<i class="fa-solid fa-gift"></i> Rewarded team "${result.team}" with ${data.amount} ₮ — New balance: ${result.new_balance} ₮`);
        $('#reward-amount').value = '';
        refreshAll();
    }
});

// ── Refresh cycle ────────────────────────
async function refreshAll() {
    await Promise.all([fetchTeams(), fetchAudience(), fetchLeaderboard()]);
}

// Initial load
refreshAll();

// Auto-refresh leaderboard every 5s
setInterval(fetchLeaderboard, 5000);
