<script lang="ts">
  import Footer from '#lib/Footer.svelte';
  import { featureFacts } from '#lib/facts.ts';
</script>
<svelte:head><title>FeatureFacts · Taskwatch</title><meta name="description" content="Taskwatch's declared capabilities and verification limits."/></svelte:head>
<main>
  <a class="back" href="/">← Taskwatch</a>
  <p class="eyebrow">xFacts label · FeatureFacts</p>
  <h1>Taskwatch</h1>
  <p class="intro">What can this product do?</p>
  <div class="label"><div class="label-title">Capabilities <span>Released · Experimental</span></div>
    {#each featureFacts.features as feature}
      <section><h2>{feature.name}</h2><p>{feature.conditions[0].value}</p><span>Declared · Docs & tests partially assessed</span></section>
    {/each}
  </div>
  <p class="limits">{featureFacts.verification_limits}</p>
  <p class="sources">Declaration by {featureFacts.declaration.actor} · {featureFacts.generated.date}<br/><a href="/facts/features.md">Read label source</a> · <a href="/facts/features.json">JSON</a> · <a href="https://featurefacts.dev" target="_blank" rel="noopener noreferrer">About FeatureFacts ↗</a></p>
  <Footer />
</main>
<style>
  :global(body){margin:0;background:#f5f6f2;color:#243c30;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}main{max-width:760px;padding:40px 24px;margin:auto}a{color:#466a46;text-underline-offset:3px}.back{font-size:13px}.eyebrow{margin-top:42px;font-size:11px;color:#7b8d70}h1{font-size:40px;letter-spacing:-1.4px;margin:10px 0}.intro{color:#6e8064;margin-bottom:28px}.label{border:1px solid #d6e1cc;border-radius:18px;background:#fff;overflow:hidden}.label-title{padding:20px;font-weight:650;border-bottom:3px solid #365a3e;display:flex;justify-content:space-between;gap:12px}.label-title span{font-size:11px;font-weight:400;color:#7c8a73}section{padding:18px 20px;border-bottom:1px solid #e8eee1}section:last-child{border:0}h2{font-size:15px;margin:0 0 7px;font-weight:550}section p{font-size:12px;color:#617456;margin:0 0 7px}section>span{font-size:10px;color:#8a977e}.limits,.sources{font-size:12px;line-height:1.8;color:#7b8971}.limits{margin-top:24px}.sources{font-size:11px}a:focus-visible{outline:3px solid #74a084;outline-offset:4px}
</style>
