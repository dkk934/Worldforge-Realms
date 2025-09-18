function isMobileDevice() {
  if (navigator.userAgentData) {
    return navigator.userAgentData.mobile;
  }
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function setupControls() {
  return isMobileDevice() ? "mobile" : "laptop";
}
