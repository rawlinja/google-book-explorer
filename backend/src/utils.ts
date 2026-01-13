function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~._-';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateCodeVerifier(): string {
  const codeVerifier = generateRandomString(128);
  return codeVerifier;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const base64Url = Buffer.from(hash)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64Url;
}

async function authorize() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const responseType = 'code';
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
  const scope = 'https://www.googleapis.com/auth/books';
  const state = generateRandomString(16);
  const codeChallengeMethod = 'S256';

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('response_type', responseType);
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('scope', scope);
  url.searchParams.append('state', state);
  url.searchParams.append('code_challenge', codeChallenge);
  url.searchParams.append('code_challenge_method', codeChallengeMethod);
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent');

  console.log(`Authorization URL: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Error during authorization: ${response.statusText}`);
  }

  console.log('Authorization data:', response);

  return {
    codeVerifier,
    codeChallenge,
    url: url.toString(),
  };
}

export class GeneratorSingleton {
  private static instance: GeneratorSingleton;
  private codeVerifier: string = '';
  private codeChallenge: string = '';

  private constructor() {}
  public static getInstance(): GeneratorSingleton {
    if (!GeneratorSingleton.instance) {
      GeneratorSingleton.instance = new GeneratorSingleton();
    }
    return GeneratorSingleton.instance;
  }
  public setCodeVerifier(codeVerifier: string): void {
    this.codeVerifier = generateCodeVerifier();
  }
  public getCodeVerifier(): string {
    return this.codeVerifier;
  }

  public async setCodeChallenge(codeChallenge: string): Promise<void> {
    this.codeChallenge = await generateCodeChallenge(codeChallenge);
  }
  public getCodeChallenge(): string {
    return this.codeChallenge;
  }
}

export { generateRandomString, generateCodeVerifier, generateCodeChallenge, authorize };
