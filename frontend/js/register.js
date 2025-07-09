// register.js
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form data
      const username = signupForm.querySelector("input[name='username']").value;
      const email = signupForm.querySelector("input[name='email']").value;
      const password = signupForm.querySelector("input[name='password']").value;

      // Prepare data to send as JSON
      const data = { username, email, password };

      // Send POST request to backend
      const res = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Make sure to set the Content-Type to application/json
        },
        body: JSON.stringify(data), // Send the form data as JSON
      });

      const responseData = await res.json();
      alert(responseData.message);
    });
  }
});
