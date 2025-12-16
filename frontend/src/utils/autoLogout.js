export function setupAutoLogout(minutes = 3200) {
  let timer;

  const resetTimer = () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }, minutes * 60 * 1000);
  };

  window.onload = resetTimer;
  window.onmousemove = resetTimer;
  window.onkeydown = resetTimer;
  window.onclick = resetTimer;
}
