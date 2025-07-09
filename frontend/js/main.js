// js/post.js
document.addEventListener("DOMContentLoaded", () => {
  const postForm = document.getElementById("postForm");

  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(postForm); // includes content + optional image

      const res = await fetch("http://localhost:3000/posts/create", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        postForm.reset();
        loadPosts();
      }
    });

    loadPosts();
  }

  async function loadPosts() {
    const container = document.getElementById("postsContainer");
    if (!container) return;

    const res = await fetch("http://localhost:3000/posts", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const data = await res.json();

    if (res.ok) {
      container.innerHTML = data.posts
        .map((p) => {
          // Only show image if the post is public and has image
          const imageHTML =
            p.is_public && p.image_url
              ? `<br><img src="http://localhost:3000${p.image_url}" alt="Post image" style="max-width: 200px; border-radius: 6px;">`
              : "";

          const visibility = p.is_public ? "🌍 Public" : "🔒 Private";

          return `
            <div class="post" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; border-radius: 8px;">
              <p><strong>${p.username}</strong></p>
              <p>${p.content}</p>
              ${imageHTML}
              <p style="font-size: 12px; color: gray;">${visibility}</p>
            </div>
          `;
        })
        .join("");
    } else {
      container.innerHTML = "<p>Error loading posts.</p>";
    }
  }
});
const logoutButtons = document.querySelectorAll('.logout-btn');

logoutButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });
});
