<svelte:head><title>Privacy · Taskwatch</title><meta name="description" content="How Taskwatch stores your tasks and protects your history."/></svelte:head>
<main>
  <a href="/">← Back to Taskwatch</a>
  <h1>Your time belongs to you.</h1>
  <p>The public Taskwatch app stores labels, timestamps, and task history in this browser on this device. Taskwatch does not upload your task content. There are no accounts, cloud sync, ads, or application analytics.</p>
  <h2>Keep a backup</h2>
  <p>Clearing site data, switching browsers, or using a private browsing session can remove or separate your history. Export JSON to keep a backup. Import JSON lets you restore it or move it between devices. An import replaces the current history only after you confirm.</p>
  <p>An unfinished task keeps accruing working time while the tab is closed. Pause or stop before leaving if you do not want that time counted.</p>
  <h2>Each address is separate</h2>
  <p>Your local app, the workers.dev address, and any custom domain have separate browser storage. Export from the old address and import at the new one when moving. Two devices do not sync.</p>
  <h2>Hosting</h2>
  <p>Cloudflare serves the public site's static files and may process ordinary request metadata such as your IP address and requested path. We do not include a performance beacon or other third-party scripts. The public build's security policy blocks external analytics connections. Task labels are not put in URLs or page titles.</p>
  <h2>Local file mode</h2>
  <p>The optional local Node app saves history to a JSON file on the computer running it. In that mode your browser sends timer actions to your own local server. It is a separate storage mode from this public browser-only app.</p>
</main>
<style>
  :global(body){margin:0;background:#f6f7f3;color:#24362c;font-family:Inter,'Segoe UI',sans-serif}main{max-width:680px;margin:0 auto;padding:48px 24px 70px}a{color:#245b44;font-size:14px}h1{font-size:36px;letter-spacing:-1px;margin:38px 0 24px}h2{font-size:19px;margin-top:30px}p{font-size:15px;line-height:1.8;color:#56634e}
</style>
