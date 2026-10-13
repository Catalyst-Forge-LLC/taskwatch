<script lang="ts">
  import { appFactsUrl } from '#lib/facts.ts';
</script>

<footer>
  <div class="credit">Built by <a href="https://catalystforge.com/" target="_blank" rel="noopener noreferrer">Catalyst Forge</a><span aria-hidden="true">·</span><a href="https://catalystforge.com/tools/" target="_blank" rel="noopener noreferrer">More tools ↗</a></div>
  <nav aria-label="Product information"><a href="/privacy">Privacy</a><span class="facts-name">xFacts</span><a href={appFactsUrl} target="_blank" rel="noopener noreferrer">AppFacts ↗</a><a href="/facts/features">FeatureFacts</a></nav>
</footer>

<style>
  footer{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:26px 0 32px;color:#7f8d75;font-size:11px;line-height:1.8}
  .credit,nav{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.credit{gap:6px}.credit>span{margin:0 4px}a{color:inherit;text-decoration:none;transition:color .18s}a:hover{color:#355c40;text-decoration:underline;text-underline-offset:3px}a:focus-visible{outline:3px solid #74a084;outline-offset:4px;border-radius:2px}.credit>a:first-of-type{font-weight:550;color:#536b4b}.facts-name{color:#99a28e;border-left:1px solid #dbe2d4;padding-left:12px}
  @media(max-width:650px){footer{justify-content:center;gap:9px;text-align:center}.credit,nav{justify-content:center}}
  @media(prefers-reduced-motion:reduce){a{transition:none}}
</style>
