async function login() {
    const username = (document.getElementById("username").value || "").trim();
    const password = String(document.getElementById("password").value || "");

    const res = await fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        window.location.href = "/dashboard.html";
    } else {
        const errorEl = document.getElementById("error");
        if (errorEl) {
            errorEl.innerText = "Invalid credentials";
        } else {
            alert("Login Failed");
        }
    }
}

window.login = login;