let analyticsData = [];

async function loadAnalytics() {

    const res = await fetch("/admin/getAnalytics", { credentials: "include" });
    const data = await res.json();

    if (!data.success) return;

    analyticsData = data.recent;

    document.getElementById("totalClicks").innerText = data.summary.total;

    renderUsers(data.summary.byUser);
    renderTweets(data.summary.byTweet);
    renderRecent(analyticsData);
}

function renderUsers(users){

    const box = document.getElementById("topUsers");

    box.innerHTML = users.map(u => `
        <div class="leader-row">
            <span>${u.name} (${u.mobile})</span>
            <b>${u.count}</b>
        </div>
    `).join("");
}

function renderTweets(tweets){

    const box = document.getElementById("topTweets");

    box.innerHTML = tweets.map(t => `
        <div class="leader-row">
            <span>${t.preview}</span>
            <b>${t.count}</b>
        </div>
    `).join("");
}

function renderRecent(list){

    const box = document.getElementById("recentActivity");

    box.innerHTML = list.map(a => `
        <div class="tweet-manage-card glass-card">
            <b>${a.name}</b> (${a.mobile})<br>
            Tweet: ${a.tweetPreview}<br>
            Time: ${new Date(a.at).toLocaleString()}
        </div>
    `).join("");
}

/* SEARCH USER */

document.getElementById("searchUser").addEventListener("input", function(){

    const q = this.value.toLowerCase();

    const filtered = analyticsData.filter(a =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.mobile || "").includes(q) ||
        (a.userId || "").toLowerCase().includes(q)
    );

    renderRecent(filtered);

});

loadAnalytics();