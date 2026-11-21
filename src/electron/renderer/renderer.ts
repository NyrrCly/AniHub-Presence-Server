const loginButton = document.querySelector(
  ".anihub-login",
) as HTMLButtonElement;
const logoutButton = document.querySelector(
  ".anihub-logout",
) as HTMLButtonElement;

const userContainer = document.querySelector(".user-container") as HTMLElement;
const userAvatar = document.querySelector(".user-avatar") as HTMLImageElement;
const userNickname = document.querySelector(
  ".user-nickname",
) as HTMLTextAreaElement;

const animeName = document.querySelector(".anime-name") as HTMLTextAreaElement;
const episodeCount = document.querySelector(
  ".episode-count",
) as HTMLTextAreaElement;
const largeImage = document.querySelector(".large-image") as HTMLImageElement;
const smallImage = document.querySelector(".small-image") as HTMLImageElement;

const accountIconPreference = document.querySelector(
  "#account-icon",
) as HTMLInputElement;
const dubbingIconPreference = document.querySelector(
  "#dubbing-icon",
) as HTMLInputElement;
const anonymityPreference = document.querySelector(
  "#anonymity",
) as HTMLInputElement;
const autoStartPreference = document.querySelector(
  "#autostart",
) as HTMLInputElement;

let avatar: string;
let username: string;
let lastDubbingStudioLogo: string = "https://anihub.in.ua/logo-192.png";

async function initializeSettings() {
  const savedWidth = (await window.store.getStoreValue("settingsWidth")) ?? 450;
  const anonymity = (await window.store.getStoreValue("anonymity")) ?? false;
  const accountIcon =
    (await window.store.getStoreValue("accountIcon")) ?? false;
  const dubbingIcon =
    (await window.store.getStoreValue("dubbingIcon")) ?? false;
  const autostart =
    (await window.store.getStoreValue("autostart")) ?? false;

  const access_token =
    (await window.store.getStoreValue("accessToken")) ?? undefined;

  if (access_token) {
    const userData = await getUserData(access_token);
    avatar = userData.picture;
    username = userData.nickname;
  }

  accountIconPreference.checked = accountIcon;
  dubbingIconPreference.checked = dubbingIcon;
  anonymityPreference.checked = anonymity;
  autoStartPreference.checked = autostart;

  showAccount(!!access_token);

  if (accountIcon || dubbingIcon) {
    smallImage.hidden = false;
    smallImage.src = accountIcon ? avatar : lastDubbingStudioLogo;
  } else if (!accountIcon || !dubbingIcon) smallImage.hidden = true;

  document.documentElement.style.setProperty(
    "--settings-width",
    `${savedWidth}px`,
  );
}

function showAccount(enable: boolean) {
  accountIconPreference.disabled = !enable;
  loginButton.hidden = enable;
  userContainer.hidden = !enable;
  userAvatar.src = enable ? avatar : "";
  userNickname.textContent = enable ? username : "";
}

function resetAccountData() {
  window.store.setStoreValue("idToken", undefined);
  window.store.setStoreValue("accessToken", undefined);
  window.store.setStoreValue("refreshToken", undefined);
  window.store.setStoreValue("avatar", undefined);
  window.store.setStoreValue("username", undefined);
}

/**
 * Save account data into electron config file
 * @param authData - auth data (Tokens)
 * @param userData - user profile data
 */
function saveAccountData(authData: any, userData: any) {
  window.store.setStoreValue("idToken", authData.id_token);
  window.store.setStoreValue("accessToken", authData.access_token);
  window.store.setStoreValue("refreshToken", authData.refresh_token);
  window.store.setStoreValue("avatar", userData.picture);
  window.store.setStoreValue("username", userData.nickname);
}

/**
 * Exchanging user auth code for tokens
 * @param code - Code from successful AniHub login
 */
async function exchangingCodeForTokens(code: string) {
  const rawSession = sessionStorage.getItem("anihub:login:pkce");
  if (!rawSession) {
    throw new Error("Can't find PKCE session in sessionStorage");
  }

  const saved = JSON.parse(rawSession);

  const response = await fetch(`https://anihub.in.ua/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: saved.redirectUri,
      client_id: saved.clientId,
      code_verifier: saved.verifier,
    }),
  });

  const authData = await response.json();
  if (!response.ok) {
    throw new Error(authData.error_description || authData.error);
  }

  return authData;
}

/**
 * Update access token with refresh token
 * @param refreshToken - refresh token that give permission to get new access token
 */
async function refreshTokens(refreshToken: string) {
  return await (window as any).AniHubLogin.refreshTokens({
    clientId: "anihub_968d66a2ed57f5629d25d6bb",
    refreshToken: refreshToken,
  });
}

/**
 * Return user data from AniHub
 * @param accessToken - access token to user account information
 */
async function getUserData(accessToken: string) {
  let userData = await (window as any).AniHubLogin.getUser(accessToken).catch(
    () => undefined,
  );

  if (!userData) {
    const refreshToken = await window.store.getStoreValue("refreshToken");
    const authData = await refreshTokens(refreshToken);
    userData = await (window as any).AniHubLogin.getUser(authData.accessToken);

    saveAccountData(
      {
        id_token: authData.idToken,
        access_token: authData.accessToken,
        refresh_token: authData.refreshToken,
      },
      userData,
    );
  }
  return userData;
}

/**
 * AniHub login event
 */
window.anihubLogin.onAuthSuccess(async (code) => {
  if (code) {
    try {
      const authData = await exchangingCodeForTokens(code);
      const userData = await getUserData(authData.access_token);

      saveAccountData(authData, userData);
      avatar = userData.picture;
      username = userData.nickname;
      showAccount(true);
    } catch (err) {
      console.error("Error when exchanging a code for access token:", err);
    }
  }
});

/**
 * AniHub logout event
 */
logoutButton.addEventListener("click", () => {
  const idToken = window.store.getStoreValue("idToken") || "";

  const logoutUrl = new URL("https://anihub.in.ua/api/oauth/logout");
  logoutUrl.searchParams.append("id_token_hint", idToken);
  logoutUrl.searchParams.append("state", "Logout");

  resetAccountData();
  enableAccountIcon(false);
  window.preference.accountIcon(false);
  accountIconPreference.checked = false;
  showAccount(false);

  window.location.href = logoutUrl.toString();
});

/**
 * Changes preview activity info
 */
window.electron.changePreviewInfo((presenceData, dubbingStudioLogo) => {
  const currentEpisode = presenceData.currentEpisode ?? "-";
  const totalEpisodes = presenceData.animeData.episodes_count ?? "∞";

  animeName.textContent = presenceData.animeData.title_ukrainian;
  episodeCount.textContent = `Епізоди: ${currentEpisode}/${totalEpisodes}`;
  largeImage.src = presenceData.animeData.poster_url;
  lastDubbingStudioLogo = dubbingStudioLogo;

  if (dubbingIconPreference.checked) smallImage.src = lastDubbingStudioLogo;
});

/**
 * Change discord activity preview for account icon setting
 */
function enableAccountIcon(enable: boolean) {
  smallImage.hidden = !enable;
  smallImage.src = avatar;
  accountIconPreference.checked = enable;
  window.store.setStoreValue("accountIcon", enable);
  window.preference.accountIcon(enable);
}

/**
 * Change discord activity preview for dubbing icon setting
 */
function enableDubbingIcon(enable: boolean) {
  smallImage.hidden = !enable;
  smallImage.src = lastDubbingStudioLogo;
  dubbingIconPreference.checked = enable;
  window.store.setStoreValue("dubbingIcon", enable);
  window.preference.dubbingIcon(enable);
}

/**
 * Account Icon preference event
 */
window.accountIcon = function () {
  const preferenceValue = accountIconPreference.checked;
  enableDubbingIcon(false);
  enableAccountIcon(preferenceValue);
};

/**
 * Dubbing Icon preference event
 */
window.dubbingIcon = function () {
  const preferenceValue = dubbingIconPreference.checked;
  enableAccountIcon(false);
  enableDubbingIcon(preferenceValue);
};

/**
 * Anonymity preference event
 */
window.anonymity = function () {
  const preferenceValue = anonymityPreference.checked;
  window.store.setStoreValue("anonymity", preferenceValue);
  window.preference.anonymity(preferenceValue);
};

/**
 * Autostart preference event
 */
window.autostart = function () {
  const preferenceValue = autoStartPreference.checked;
  window.store.setStoreValue("autostart", preferenceValue);
  window.preference.autostart(preferenceValue);
};

/**
 * Save setting container width before close
 */
window.electron.onBeforeClose(() => {
  const settingsElement = document.querySelector(".settings") as HTMLElement;
  if (settingsElement) {
    const width = Math.round(settingsElement.getBoundingClientRect().width);
    window.store.setStoreValue("settingsWidth", width);
  }
  window.electron.ackClose();
});

initializeSettings();
