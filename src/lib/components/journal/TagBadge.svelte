<script lang="ts">
  import { i18n } from '$lib/i18n.svelte'
  import { getTagCategory, isPredefinedTag, TAG_CATEGORY_COLOR } from './tag-data'

  let { tag }: { tag: string } = $props()

  let category = $derived(getTagCategory(tag))
  let label = $derived(isPredefinedTag(tag) ? i18n.t('journal.tags.' + tag) : tag)
</script>

<span
  class="tag-badge"
  style:background={`color-mix(in srgb, ${TAG_CATEGORY_COLOR[category]} 16%, transparent)`}
  style:color={TAG_CATEGORY_COLOR[category]}
>
  {label}
</span>

<style>
  .tag-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
  }
</style>
