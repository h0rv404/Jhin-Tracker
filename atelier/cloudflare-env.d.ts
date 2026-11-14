declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    RIOT_KEY_ENCRYPTION_SECRET?: string;
    RIOT_API_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
