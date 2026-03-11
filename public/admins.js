async function getMyRole() {
  try {
    const r = await fetch("/admin/myRole", { credentials: "include" });
    const data = await r.json();
    return data.role || "normal";
  } catch (e) {
    return "normal";
  }
}

async function loadAdmins() {
  const role = await getMyRole();

  // If not super admin, hide everything
  if (role !== "super") {
    document.body.innerHTML = `
      <div class="dashboard-container" style="margin-top:40px;">
        <div class="card glass-card" style="text-align:center;">
          <h2 style="color:#d32f2f;">Access Denied</h2>
          <p>Super Admin only.</p>
          <a href="/dashboard.html" class="logout-btn" style="display:inline-block;margin-top:10px;text-decoration:none;">Back</a>
        </div>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch("/admin/getAdmins", { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast("Failed to load admins ❌", 3000);
      return;
    }

    const admins = Array.isArray(data.admins) ? data.admins : [];

    const box = document.getElementById("adminsList");
    box.innerHTML = "";

    if (admins.length === 0) {
      box.innerHTML = "<p>No admins found.</p>";
      return;
    }

    admins.forEach((a) => {
      const row = document.createElement("div");
      row.className = "leader-row";

      row.innerHTML = `
        <span><b>${a.username}</b> (${a.role})</span>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="delete-btn" onclick="deleteAdmin('${a.username}')">Delete</button>
        </div>
      `;

      box.appendChild(row);
    });
  } catch (e) {
    console.error(e);
    showToast("Error loading admins ❌", 3000);
  }
}

async function addAdmin() {
  const username = (document.getElementById("username").value || "").trim();
  const password = (document.getElementById("password").value || "").trim();
  const role = document.getElementById("role").value;

  if (!username) {
    showToast("Username required", 3000);
    return;
  }
  if (password.length < 4) {
    showToast("Password must be at least 4 characters", 3000);
    return;
  }

  try {
    const res = await fetch("/admin/addAdmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, role }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showToast("Admin added ✅", 3000);
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
      document.getElementById("role").value = "normal";
      loadAdmins();
    } else {
      showToast(data.message || "Failed to add admin ❌", 3000);
    }
  } catch (e) {
    console.error(e);
    showToast("Failed to add admin ❌", 3000);
  }
}

async function deleteAdmin(username) {
  const ok = confirm(`Delete admin "${username}"?`);
  if (!ok) return;

  try {
    const res = await fetch(`/admin/deleteAdmin/${encodeURIComponent(username)}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showToast("Admin deleted ✅", 3000);
      loadAdmins();
    } else {
      showToast(data.message || "Failed to delete ❌", 3000);
    }
  } catch (e) {
    console.error(e);
    showToast("Failed to delete ❌", 3000);
  }
}

/* Make functions available to HTML onclick */
window.addAdmin = addAdmin;
window.deleteAdmin = deleteAdmin;

/* INIT */
loadAdmins();