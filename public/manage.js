const MANAGE_CHAR_ALERT_LIMIT = 230;
const MANAGE_HARD_TWEET_LIMIT = 280;

function updateManageCharUI(counterEl, alertEl, length) {
  if (!counterEl) return;

  counterEl.innerText = `${length} characters`;
  counterEl.classList.remove("limit-warning", "limit-danger");

  if (alertEl) alertEl.innerText = "";

  if (length >= MANAGE_HARD_TWEET_LIMIT) {
    counterEl.classList.add("limit-danger");
    if (alertEl) {
      alertEl.innerText = `Alert: character reached ${MANAGE_CHAR_ALERT_LIMIT}+ and now crossed ${MANAGE_HARD_TWEET_LIMIT}. You can still continue.`;
    }
  } else if (length >= MANAGE_CHAR_ALERT_LIMIT) {
    counterEl.classList.add("limit-warning");
    if (alertEl) {
      alertEl.innerText = `Alert: character reached ${MANAGE_CHAR_ALERT_LIMIT} limit type. You can still continue.`;
    }
  }
}

async function loadTweets() {
  try {
    const res = await fetch("/getTweets", { credentials: "include" });
    const tweets = await res.json();

    const container = document.getElementById("tweetList");
    container.innerHTML = "";

    if (!Array.isArray(tweets) || tweets.length === 0) {
      container.innerHTML = "<p>No tweets found.</p>";
      return;
    }

    tweets.reverse().forEach(t => {
      const card = document.createElement("div");
      card.className = "tweet-manage-card glass-card";

      const mediaPreview = !t.media
        ? `<div class="manage-no-media">No media uploaded</div>`
        : t.media.toLowerCase().endsWith(".mp4")
        ? `
          <div class="manage-video-card">
            <video src="${t.media}" class="manage-img manage-video-thumb" controls preload="metadata" muted playsinline></video>
            <div class="manage-media-badge">MP4 Video</div>
          </div>
        `
        : `
          <div class="manage-image-card">
            <img src="${t.media}" class="manage-img" alt="Post media">
            <div class="manage-media-badge">Image</div>
          </div>
        `;

      card.innerHTML = `
<textarea class="manage-textarea">${t.content || ""}</textarea>
<div class="manage-char-counter">0 characters</div>
<div class="manage-char-alert-text"></div>

<div class="manage-preview-wrap">
  ${mediaPreview}
</div>

        <input type="file" class="manage-media-input" accept="image/jpeg,image/png,video/mp4">
        <small class="manage-size-warning" style="display:block; color:#d32f2f; margin-top:4px;"></small>

        <div class="manage-upload-progress-wrap" style="display:none;">
          <div class="upload-progress-bar">
            <div class="manage-upload-progress-fill"></div>
          </div>
          <div class="manage-upload-progress-text">0%</div>
        </div>

<div class="manage-buttons">
  <button class="update-btn">Update</button>
  <button class="replace-btn">${t.media ? "Replace Media" : "Upload Media"}</button>
  ${t.media ? '<button class="remove-media-btn">Remove Media</button>' : ''}
  <button class="delete-btn">Delete</button>
</div>
      `;

      container.appendChild(card);

const textarea = card.querySelector(".manage-textarea");
const manageCharCounter = card.querySelector(".manage-char-counter");
const manageCharAlert = card.querySelector(".manage-char-alert-text");
const mediaInput = card.querySelector(".manage-media-input");
const sizeWarning = card.querySelector(".manage-size-warning");
const progressWrap = card.querySelector(".manage-upload-progress-wrap");
const progressFill = card.querySelector(".manage-upload-progress-fill");
const progressText = card.querySelector(".manage-upload-progress-text");

autoExpand(textarea);

function refreshManageCounter() {
  updateManageCharUI(manageCharCounter, manageCharAlert, (textarea.value || "").length);
}

textarea.addEventListener("input", refreshManageCounter);
refreshManageCounter();

      function setCardProgress(percent) {
        progressWrap.style.display = "block";
        progressFill.style.width = percent + "%";
        progressText.innerText = percent + "%";
      }

      function resetCardProgress() {
        progressFill.style.width = "0%";
        progressText.innerText = "0%";
        progressWrap.style.display = "none";
      }

      mediaInput.addEventListener("change", () => {
        const file = mediaInput.files[0];
        sizeWarning.innerText = "";

        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
        if (!allowedTypes.includes(file.type)) {
          showToast("Only JPEG, PNG and MP4 files are allowed.", 3000);
          mediaInput.value = "";
          return;
        }

        if (file.type === "video/mp4" && file.size > 30 * 1024 * 1024) {
          sizeWarning.innerText = "Video size must be 30MB or less.";
        }
      });

card.querySelector(".update-btn").addEventListener("click", async () => {
if ((textarea.value || "").length >= MANAGE_CHAR_ALERT_LIMIT) {
  showToast(`Alert: character reached ${MANAGE_CHAR_ALERT_LIMIT} limit type. Update will still continue.`, 3000);
}

  const r = await fetch(`/admin/updateTweet/${t.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content: textarea.value })
  });

  if (r.ok) {
    showToast("Tweet Updated Successfully ✅", 3000);
    loadTweets();
  } else {
    showToast("Update failed ❌", 3000);
  }
});

card.querySelector(".replace-btn").addEventListener("click", async () => {
  const file = mediaInput.files[0];

  if (!file) {
    showToast("Please select a media file first.", 3000);
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
  if (!allowedTypes.includes(file.type)) {
    showToast("Only JPEG, PNG and MP4 files are allowed.", 3000);
    mediaInput.value = "";
    return;
  }

  if (file.type === "video/mp4" && file.size > 30 * 1024 * 1024) {
    showToast("Video size must be 30MB or less.", 3000);
    return;
  }

  const fd = new FormData();
  fd.append("media", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/admin/uploadTweetMedia/${t.id}`, true);
  xhr.withCredentials = true;

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      setCardProgress(percent);
    }
  });

  xhr.onload = () => {
    let data = {};
    try {
      data = JSON.parse(xhr.responseText || "{}");
    } catch (_) {}

    if (xhr.status >= 200 && xhr.status < 300 && data.success) {
      showToast(t.media ? "Media replaced successfully ✅" : "Media uploaded successfully ✅", 3000);
      loadTweets();
    } else {
      showToast(data.message || "Media replace failed ❌", 3000);
      setTimeout(resetCardProgress, 800);
    }
  };

  xhr.onerror = () => {
    showToast("Upload failed ❌", 3000);
    setTimeout(resetCardProgress, 800);
  };

  xhr.send(fd);
});

const removeMediaBtn = card.querySelector(".remove-media-btn");
if (removeMediaBtn) {
  removeMediaBtn.addEventListener("click", async () => {
    const ok = confirm("Remove media from this post?");
    if (!ok) return;

    try {
      const res = await fetch(`/admin/removeTweetMedia/${t.id}`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showToast("Media removed successfully ✅", 3000);
        loadTweets();
      } else {
        showToast(data.message || "Remove media failed ❌", 3000);
      }
    } catch (err) {
      console.error(err);
      showToast("Remove media failed ❌", 3000);
    }
  });
}

      card.querySelector(".delete-btn").addEventListener("click", async () => {
        const ok = confirm("Delete this tweet?");
        if (!ok) return;

        const r = await fetch(`/admin/deleteTweet/${t.id}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (r.ok) {
          showToast("Tweet Deleted ❌", 3000);
          loadTweets();
        } else {
          showToast("Delete failed ❌", 3000);
        }
      });
    });

  } catch (err) {
    console.error(err);
    const container = document.getElementById("tweetList");
    if (container) container.innerHTML = "<p>Failed to load tweets. Check console.</p>";
  }
}

/* DELETE ALL POSTS */
document.addEventListener("click", async (e) => {
  if (e.target.id === "deleteAllTweets") {
    const ok = confirm("Delete ALL tweets permanently?");
    if (!ok) return;

    const r = await fetch("/admin/deleteAllTweets", {
      method: "DELETE",
      credentials: "include"
    });

    if (r.ok) {
      showToast("All Tweets Deleted ❌", 3000);
      loadTweets();
    } else {
      showToast("Failed to delete all tweets ❌", 3000);
    }
  }
});

function autoExpand(field) {
  field.style.height = "auto";
  field.style.height = field.scrollHeight + "px";
  field.addEventListener("input", () => {
    field.style.height = "auto";
    field.style.height = field.scrollHeight + "px";
  });
}

window.loadTweets = loadTweets;

if (document.getElementById("tweetList")) loadTweets();