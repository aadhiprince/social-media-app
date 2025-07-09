document.addEventListener("DOMContentLoaded", () => {
  const changePasswordForm = document.getElementById("changePasswordForm");

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const oldPassword = changePasswordForm.querySelector("input[name='old_password']").value.trim();
      const newPassword = changePasswordForm.querySelector("input[name='new_password']").value.trim();
      const confirmPassword = changePasswordForm.querySelector("input[name='confirm_password']").value.trim();

      if (!oldPassword || !newPassword || !confirmPassword) {
        return alert("Please fill in all fields.");
      }

      if (newPassword !== confirmPassword) {
        return alert("New password and confirmation do not match.");
      }

      try {
        const res = await fetch("http://localhost:3000/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          alert("✅ Password changed successfully.");
          changePasswordForm.reset(); // optional: clear the form
        } else {
          alert(data.message || "❌ Failed to change password.");
        }
      } catch (err) {
        alert("⚠️ Server error. Please try again later.");
      }
    });
  }
});
