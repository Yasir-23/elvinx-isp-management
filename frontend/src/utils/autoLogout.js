// Change the default to 60 so it's consistent everywhere
export function setupAutoLogout(minutes = 60) {
  let timer;

  const logout = () => {
    console.log("Inactivity detected. Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("admin"); // Clear user data too
    window.location.href = "/login";
  };

  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(logout, minutes * 60 * 1000);
  };

  // Standard activity listeners
  window.onload = resetTimer;
  window.onmousemove = resetTimer;
  window.onkeydown = resetTimer;
  window.onclick = resetTimer;
  window.onscroll = resetTimer; // Added scroll for better detection
  
  // Start the timer immediately when the function is called
  resetTimer();
}