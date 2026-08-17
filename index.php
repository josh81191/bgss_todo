<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>BGSS Todo</title>
  <link rel="stylesheet" href="assets/css/style_login.css?<?php echo time(); ?>" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</head>

<body>
  <div id="connectionBanner" class="connection-banner hidden">No internet connection</div>

  <div class="login-shell">
    <div class="login-card">
      <div class="brand-block">
        <img src="assets/images/logo.png" alt="BGSS Logo" class="brand-mark" />
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
          <h3 style="color: var(--primary);">BGSS</h3>
          <span style="color: rgb(87, 87, 87);">Task Management System</span>
        </div>
      </div>

      <form id="loginForm" class="login-form">
        <input type="text" id="username" name="username" placeholder="Username" autocomplete="username" required />

        <input type="password" id="password" name="password" placeholder="Password" autocomplete="current-password"
          required />

        <button type="submit" class="primary-btn">Login</button>
      </form>

      <div id="loginMessage" class="message" aria-live="polite"></div>
    </div>
  </div>

  <script>
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const loginBtn = loginForm.querySelector('.primary-btn');
  const connectionBanner = document.getElementById('connectionBanner');

  window.addEventListener('online', () => connectionBanner.classList.add('hidden'));
  window.addEventListener('offline', () => {
    connectionBanner.classList.remove('hidden');
    connectionBanner.classList.remove('warning');
    connectionBanner.textContent = 'No internet connection';
  });

  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    loginMessage.textContent = '';
    loginMessage.className = 'message';

    const payload = {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value.trim()
    };

    if (!payload.username || !payload.password) {
      showMessage('Please enter both username and password.', 'error');
      return;
    }

    if (!navigator.onLine) {
      showMessage('No internet connection. Please reconnect and try again.', 'error');
      return;
    }

    setLoading(true);

    // Warn the user without aborting the request if the server is slow to respond.
    const slowConnectionTimer = setTimeout(() => {
      showMessage('Still working… your connection seems slow.', 'warning');
    }, 4000);

    try {
      const response = await fetch('php/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Signed in. Redirecting…', 'info');
        window.location.href = 'dashboard.php';
        return;
      }

      showMessage(data.error || 'Login failed.', 'error');
    } catch (error) {
      console.error(error);
      showMessage(
        navigator.onLine ? 'Server error. Please try again.' : 'No internet connection. Please reconnect and try again.',
        'error'
      );
    } finally {
      clearTimeout(slowConnectionTimer);
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.innerHTML = isLoading ? '<span class="btn-spinner"></span>Signing in…' : 'Login';
  }

  function showMessage(message, state) {
    loginMessage.textContent = message;
    loginMessage.classList.add(state);
  }
  </script>
</body>

</html>