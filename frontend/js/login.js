// login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg"); // Error message placeholder

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorMsg.textContent = ""; // Clear any previous errors

      // Get form data
      const email = loginForm.querySelector("input[name='email']").value.trim();
      const password = loginForm.querySelector("input[name='password']").value;

      if (!email || !password) {
        errorMsg.textContent = "Please fill in all fields.";
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const responseData = await res.json();

        if (res.ok && responseData.token) {
          localStorage.setItem("token", responseData.token);
          window.location.href = "dashboard.html";
        } else {
          errorMsg.textContent = responseData.message || "Invalid credentials.";
        }
      } catch (err) {
        errorMsg.textContent = "Server error. Please try again later.";
      }
    });
  }
});
