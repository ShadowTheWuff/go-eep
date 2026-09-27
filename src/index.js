// go-eep: pings a webhook at bedtime telling you to go to sleep.
// Cron runs in UTC, so we fire at two UTC hours and only send when it's
// actually BEDTIME_HOUR in TIMEZONE. That keeps it right across DST.

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(maybePing(env));
  },

  // Handy for manual testing: visit /ping?key=YOUR_TEST_KEY
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ping" && env.TEST_KEY && url.searchParams.get("key") === env.TEST_KEY) {
      await sendPing(env);
      return new Response("pinged 🛏️");
    }
    return new Response("go eep", { status: 200 });
  },
};

async function maybePing(env) {
  const tz = env.TIMEZONE || "America/Chicago";
  const bedtime = Number(env.BEDTIME_HOUR ?? 23);

  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date())
  );

  if (hour === bedtime) await sendPing(env);
}

async function sendPing(env) {
  const message = env.MESSAGE || "go eep 🛏️";
  const mention = env.DISCORD_USER_ID ? `<@${env.DISCORD_USER_ID}> ` : "";

  const res = await fetch(env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Discord uses "content". For Slack, change this to { text: ... }.
    body: JSON.stringify({ content: mention + message }),
  });

  if (!res.ok) console.error(`Webhook failed: ${res.status} ${await res.text()}`);
}
