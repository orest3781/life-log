// Browser-only Google OAuth via Google Identity Services (GIS). We request the
// least-privilege `drive.file` scope: the app can only ever see and touch the
// files it creates itself — never the rest of the user's Drive.
//
// The client ID is public (it ships in client JS) and comes from the build-time
// env var VITE_GOOGLE_CLIENT_ID. Without it, the feature reports "not configured".

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface TokenClient {
  callback: (resp: TokenResponse) => void
  error_callback?: (err: { type?: string }) => void
  requestAccessToken: (opts?: { prompt?: string }) => void
}

interface GoogleOAuth {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (resp: TokenResponse) => void
      }) => TokenClient
    }
  }
}

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID)
}

let gisPromise: Promise<void> | null = null
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    const w = window as unknown as { google?: GoogleOAuth }
    if (w.google?.accounts?.oauth2) return resolve()
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Google sign-in.'))
    document.head.appendChild(script)
  })
  return gisPromise
}

let tokenClient: TokenClient | null = null
let accessToken: string | null = null
let tokenExpiry = 0

async function getTokenClient(): Promise<TokenClient> {
  await loadGis()
  if (!tokenClient) {
    const w = window as unknown as { google: GoogleOAuth }
    tokenClient = w.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID as string,
      scope: SCOPE,
      callback: () => {}, // replaced per-request below
    })
  }
  return tokenClient
}

// Load the Google script and initialize the token client ahead of time, so the
// later requestAccessToken() can fire synchronously inside the user's click.
// Without this, the first click waits on the script download — which drops the
// browser's transient activation and the popup is blocked (popup_failed_to_open).
export function preloadGoogleAuth(): void {
  if (!CLIENT_ID) return
  void getTokenClient().catch(() => {})
}

// Returns a valid access token, reusing the in-memory one until it nears
// expiry. The first call (and any after the ~1h token lapses) shows Google's
// account/consent UI, so it must originate from a user gesture. When the client
// was preloaded, we avoid awaiting so the popup opens within that gesture.
export async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID) throw new Error('Google Drive is not configured.')
  if (accessToken && Date.now() < tokenExpiry - 60_000) return accessToken

  const client = tokenClient ?? (await getTokenClient())
  return new Promise<string>((resolve, reject) => {
    client.callback = (resp) => {
      if (resp.error || !resp.access_token) {
        reject(new Error(resp.error || 'Authorization failed.'))
        return
      }
      accessToken = resp.access_token
      tokenExpiry = Date.now() + (Number(resp.expires_in) || 3600) * 1000
      resolve(accessToken)
    }
    client.error_callback = (err) =>
      reject(new Error(err?.type || 'Authorization was cancelled.'))
    client.requestAccessToken({ prompt: '' })
  })
}

// True when a usable token is already held (no UI needed) — lets callers do a
// silent background backup without risking a blocked popup.
export function hasLiveToken(): boolean {
  return accessToken !== null && Date.now() < tokenExpiry - 60_000
}

export function clearToken(): void {
  accessToken = null
  tokenExpiry = 0
}
