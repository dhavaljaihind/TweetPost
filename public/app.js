const TWITTER_LIMIT = 280;

async function loadData() {
    const trendRes = await fetch("/trendSettings", { credentials: "include" });
    const trendData = await trendRes.json().catch(() => ({}));

    const tweets = await (await fetch("/getTweets", { credentials: "include" })).json();
    const mentions = await (await fetch("/getMentions", { credentials: "include" })).json();

    const container = document.getElementById("tweetsContainer");
    const trendTitleWrap = document.getElementById("trendTitleWrap");
    const trendTitleText = document.getElementById("trendTitleText");
    const trendMessageWrap = document.getElementById("trendMessageWrap");
    const trendMessageText = document.getElementById("trendMessageText");

    container.innerHTML = "";
    if (trendTitleWrap) trendTitleWrap.style.display = "none";
    if (trendMessageWrap) trendMessageWrap.style.display = "none";
    if (trendTitleText) trendTitleText.innerText = "";
    if (trendMessageText) trendMessageText.innerText = "";

    const trendEnabled = !!trendData?.settings?.enabled;
    const trendTitle = String(trendData?.settings?.title || "").trim();
    const trendMessage = String(trendData?.settings?.message || "").trim();

    if (!trendEnabled) {
        if (trendMessageWrap) trendMessageWrap.style.display = "block";
        if (trendMessageText) {
            trendMessageText.innerText =
                trendMessage || "Currently no trends available. We will inform you when trend is available.";
        }
        return;
    }

    if (trendTitle) {
        if (trendTitleWrap) trendTitleWrap.style.display = "block";
        if (trendTitleText) trendTitleText.innerText = trendTitle;
    }

    if (!Array.isArray(tweets) || tweets.length === 0) {
        container.innerHTML = "<p class='empty-msg'>No posts available.</p>";
        return;
    }

    tweets.forEach(tweet => {
        const card = document.createElement("div");
        card.className = "tweet-card";

        const mentionHTML = mentions.map(m => `
            <label class="mention-option">
                <input type="checkbox" value="${m}">
                <span>${m}</span>
            </label>
        `).join("");

        const mediaPreview = !tweet.media
            ? ''
            : tweet.media.toLowerCase().endsWith(".mp4")
            ? `<video src="${tweet.media}" class="tweet-media" controls></video>`
            : `<img src="${tweet.media}" class="tweet-media">`;

        const downloadButton = tweet.media
            ? `<a href="${tweet.media}" class="download-btn" download target="_blank">Download Media</a>`
            : '';

        card.innerHTML = `
            <div class="tweet-content">
                <div class="tweet-preview"></div>

                <div class="media-preview-box">
                    ${mediaPreview}
                </div>

                ${downloadButton}

                <div class="char-counter">
                    <span class="count">0</span> / ${TWITTER_LIMIT}
                </div>

                <div class="limit-warning"></div>
            </div>

            <div class="mentions-section">
                <h4>Select Mentions</h4>
                ${mentionHTML}
            </div>

            <button class="tweet-btn">Tweet Now 🚀</button>
        `;

        container.appendChild(card);

        const btn = card.querySelector(".tweet-btn");
        const counter = card.querySelector(".count");
        const counterWrapper = card.querySelector(".char-counter");
        const warning = card.querySelector(".limit-warning");
        const preview = card.querySelector(".tweet-preview");

        let isPosted = false;

        function updateContent() {
            const selected = Array.from(
                card.querySelectorAll("input[type=checkbox]:checked")
            ).map(c => c.value).join(" ");

            const personal = document.getElementById("personalTag").value.trim();

            const finalText =
                tweet.content +
                (selected ? " " + selected : "") +
                (personal ? " " + personal : "");

            preview.innerText = finalText;

            const length = finalText.length;
            counter.innerText = length;

            if (length > TWITTER_LIMIT) {
                counterWrapper.classList.add("limit-exceed");
                warning.innerText = "⚠ More than 280 characters needs a verified badge on Twitter/X, but verified users can still post it.";
            } else {
                counterWrapper.classList.remove("limit-exceed");
                warning.innerText = "";
            }
        }

        btn.addEventListener("click", async () => {
            const finalText = preview.innerText;

            if (isPosted) {
                showToast("This tweet is already posted.", 2500);
                return;
            }

            if (finalText.length > TWITTER_LIMIT) {
                showToast("More than 280 characters needs a verified badge on Twitter/X. Verified users can still post it.", 3500);
            }

            try {
                await fetch("/api/trackTweet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        tweetId: tweet.id,
                        textLen: finalText.length
                    })
                });
            } catch (e) {
                console.log("Analytics failed");
            }

            const url =
                "https://twitter.com/intent/tweet?text=" +
                encodeURIComponent(finalText);

            window.open(url, "_blank");

            isPosted = true;
            btn.classList.add("tweeted");
            btn.innerText = "✅ Tweeted";
            btn.disabled = true;

            container.appendChild(card);
            card.scrollIntoView({ behavior: "smooth", block: "end" });
        });

        card.querySelectorAll("input[type=checkbox]").forEach(cb => {
            cb.addEventListener("change", updateContent);
        });

        document.getElementById("personalTag")
            .addEventListener("input", updateContent);

        updateContent();
    });
}

loadData();